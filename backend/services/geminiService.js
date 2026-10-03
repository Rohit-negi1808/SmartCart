// All Gemini-specific logic lives here so controllers never talk to the
// Gemini SDK directly. This keeps the AI provider swappable and keeps
// the API key confined to the backend.
//
// Uses @google/genai, the current unified Google Gen AI SDK. The older
// @google/generative-ai package reached end-of-life Aug 31, 2025 - it was
// still listed as a dependency and still being imported here, which was
// the actual cause of the chatbot failing silently.

const { GoogleGenAI } = require('@google/genai');

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

// "gemini-flash-latest" is Google's maintained alias for their current
// fast/cheap Flash model - Google repoints it as models are upgraded or
// retired, so this one config value is the only place that can go stale.
// Pin to a specific dated model instead if you need fully reproducible
// behavior across model upgrades.
const MODEL_NAME = 'gemini-flash-latest';

// --- Error classification ---
// Turns whatever the SDK/network throws into a safe, specific
// {httpStatus, code, message} the controller can act on, WITHOUT ever
// including the API key. Used by answerChatQuestion, whose caller
// (chatController) is expected to surface real errors during development
// rather than hide them.
const classifyGeminiError = (error) => {
  if (!process.env.GEMINI_API_KEY) {
    return { httpStatus: 500, code: 'missing_key', message: 'Gemini API key is not configured.' };
  }
  const msg = String(error && error.message ? error.message : error).toLowerCase();

  // A specific, documented Google-side issue (not a bug in this code):
  // newer "AQ."-prefixed Authorization keys sometimes get rejected with
  // this exact error even when sent correctly, because Google's server
  // misclassifies the key as an unsupported OAuth token type. Reported
  // widely since mid-2026. Surface this distinctly so it's not confused
  // with "you typed the wrong key".
  if (msg.includes('access_token_type_unsupported') || (msg.includes('unauthenticated') && msg.includes('token'))) {
    return {
      httpStatus: 502,
      code: 'auth_key_rejected',
      message:
        'Google rejected the API key with ACCESS_TOKEN_TYPE_UNSUPPORTED - a known issue affecting some AQ.-prefixed Authorization keys, not a bug in this code. Try regenerating the key in AI Studio, or restricting it to "Gemini API only" on the API Keys page, and retry.',
    };
  }
  if (msg.includes('api key not valid') || msg.includes('api_key_invalid') || msg.includes('401') || msg.includes('permission_denied') || msg.includes('403')) {
    return { httpStatus: 502, code: 'invalid_key', message: 'The AI service rejected our API key. Check GEMINI_API_KEY in backend/.env.' };
  }
  if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
    return { httpStatus: 429, code: 'rate_limited', message: 'The AI service is rate-limited right now. Please try again shortly.' };
  }
  if (msg.includes('not found') && msg.includes('model')) {
    return { httpStatus: 502, code: 'unsupported_model', message: 'The configured Gemini model is unavailable. Check MODEL_NAME in geminiService.js.' };
  }
  if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('etimedout') || msg.includes('network')) {
    return { httpStatus: 503, code: 'network_error', message: 'Could not reach the AI service (network error).' };
  }
  // Google's own model-capacity error (not an error in this project).
  // Explicitly documented by Google as usually transient, hence the
  // automatic retry in generateText() below before this is ever reached.
  if (msg.includes('unavailable') || msg.includes('"code":503') || msg.includes('high demand')) {
    return {
      httpStatus: 503,
      code: 'overloaded',
      message: "Gemini is experiencing high demand on Google's side right now. This usually resolves within seconds - please try again.",
    };
  }
  return { httpStatus: 502, code: 'unknown', message: 'The AI service failed to respond.' };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isRetryable = (error) => {
  const msg = String(error && error.message ? error.message : error).toLowerCase();
  return msg.includes('unavailable') || msg.includes('"code":503') || msg.includes('high demand');
};

// One shared helper for every Gemini text call in this file. Retries once,
// after a short delay, specifically for Google's transient 503/UNAVAILABLE
// "high demand" error (documented by Google as usually temporary) - any
// other error fails immediately rather than wasting time retrying.
const generateText = async (prompt) => {
  const ai = getClient();
  const call = () => ai.models.generateContent({ model: MODEL_NAME, contents: prompt });

  let response;
  try {
    response = await call();
  } catch (error) {
    if (!isRetryable(error)) throw error;
    console.warn('[gemini] model overloaded (503) - retrying once after 1.2s...');
    await sleep(1200);
    response = await call(); // if this also fails, let it throw up to the caller
  }

  if (!response || !response.text || !response.text.trim()) {
    throw new Error('Gemini returned an empty response');
  }
  return response.text;
};

// Strips markdown code fences etc. in case the model wraps its JSON.
const cleanJsonText = (text) =>
  text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

const ALLOWED_USE_CASES = ['programming', 'gaming', 'student', 'business', 'video-editing', 'general'];
const ALLOWED_STORAGE_TYPES = ['SSD', 'HDD', 'SSD+HDD'];
const ALLOWED_BATTERY = ['low', 'medium', 'high'];
const ALLOWED_GPU = ['basic', 'mid', 'high'];

/**
 * Converts a natural-language product query into structured requirements.
 * Gemini is only used to understand intent - it never invents product data.
 * Returns a validated, safe-to-use object. Falls back to a permissive
 * empty object shape if Gemini fails or returns something unusable, so AI
 * search degrades to general results instead of breaking the page.
 */
const extractRequirements = async (query) => {
  const prompt = `You are a requirements extraction engine for a laptop/tech shopping site.
Convert the user's natural-language request into ONLY a JSON object (no prose, no markdown fences) with this exact shape:

{
  "category": "laptop",
  "maxPrice": number or null,
  "minPrice": number or null,
  "minRam": number or null,
  "storageType": "SSD" | "HDD" | "SSD+HDD" | null,
  "minStorage": number or null,
  "useCase": "programming" | "gaming" | "student" | "business" | "video-editing" | "general" | null,
  "gpuPreference": "basic" | "mid" | "high" | null,
  "batteryPreference": "low" | "medium" | "high" | null,
  "brand": string or null
}

Rules:
- Only output the JSON object, nothing else.
- Prices are in Indian Rupees (INR). Interpret Indian numbering like "70k", "70,000", "1 lakh" (=100000), "1.5 lakh" (=150000) correctly. If the user gives a bare number, assume INR.
- gpuPreference: "high" for phrases like "good/powerful/dedicated GPU", "RTX", "gaming graphics", "4/5 graphics card" or similar; "mid" for "decent graphics" or light gaming/editing; "basic" only if they explicitly say they don't need graphics performance; otherwise null.
- useCase: if the user mentions multiple things (e.g. "programming and occasional gaming"), pick the ONE that sounds like their PRIMARY/most demanding need - do not guess a use case they didn't imply at all.
- If a field cannot be inferred, use null. Do not invent brands or products.

User request: """${query}"""`;

  try {
    console.log('[gemini] extractRequirements: request started');
    const rawText = await generateText(prompt);
    const parsed = JSON.parse(cleanJsonText(rawText));
    console.log('[gemini] extractRequirements: request succeeded');
    return validateRequirements(parsed);
  } catch (error) {
    const { code } = classifyGeminiError(error);
    console.error(`[gemini] extractRequirements: request failed (${code}):`, error.message);
    // Safe fallback: no filters extracted, backend will just show general results
    return { ...EMPTY_REQUIREMENTS, _aiFailed: true };
  }
};

const EMPTY_REQUIREMENTS = {
  category: 'laptop',
  maxPrice: null,
  minPrice: null,
  minRam: null,
  storageType: null,
  minStorage: null,
  useCase: null,
  gpuPreference: null,
  batteryPreference: null,
  brand: null,
};

// Defensive validation: never trust the AI's output blindly.
const validateRequirements = (data) => {
  if (!data || typeof data !== 'object') return { ...EMPTY_REQUIREMENTS };

  const out = { ...EMPTY_REQUIREMENTS };

  if (typeof data.category === 'string') out.category = data.category;

  if (typeof data.maxPrice === 'number' && data.maxPrice > 0) out.maxPrice = data.maxPrice;
  if (typeof data.minPrice === 'number' && data.minPrice > 0) out.minPrice = data.minPrice;

  if (typeof data.minRam === 'number' && data.minRam > 0 && data.minRam <= 128) out.minRam = data.minRam;

  if (ALLOWED_STORAGE_TYPES.includes(data.storageType)) out.storageType = data.storageType;
  if (typeof data.minStorage === 'number' && data.minStorage > 0) out.minStorage = data.minStorage;

  if (ALLOWED_USE_CASES.includes(data.useCase)) out.useCase = data.useCase;
  if (ALLOWED_GPU.includes(data.gpuPreference)) out.gpuPreference = data.gpuPreference;
  if (ALLOWED_BATTERY.includes(data.batteryPreference)) out.batteryPreference = data.batteryPreference;

  if (typeof data.brand === 'string' && data.brand.trim().length > 0 && data.brand.length < 40) {
    out.brand = data.brand.trim();
  }

  return out;
};

/**
 * Generates a short, grounded explanation of why a product matches a
 * user's requirements. Only the actual product fields and requirements
 * are passed in - Gemini is instructed not to add specs that aren't there.
 */
const generateMatchExplanation = async (product, requirements, matchScore) => {
  const prompt = `You are writing a short "why this matches" explanation for an e-commerce shopper.
Use ONLY the facts given below. Do not invent or assume any specification that is not listed.
Respond with 3-5 short bullet points, plain text, one bullet per line, starting each line with "- ".

User requirements: ${JSON.stringify(requirements)}
Match score: ${matchScore}%
Product data: ${JSON.stringify({
    name: product.name,
    brand: product.brand,
    price: product.price,
    specifications: product.specifications,
    useCases: product.useCases,
    rating: product.rating,
  })}`;

  try {
    console.log('[gemini] generateMatchExplanation: request started');
    const text = await generateText(prompt);
    console.log('[gemini] generateMatchExplanation: request succeeded');
    return text.trim();
  } catch (error) {
    const { code } = classifyGeminiError(error);
    console.error(`[gemini] generateMatchExplanation: request failed (${code}):`, error.message);
    return null; // caller falls back to a rule-based explanation
  }
};

/**
 * Compares 2-3 products using only the supplied product data.
 */
const generateComparison = async (products) => {
  const prompt = `You are comparing tech products for a shopper. Use ONLY the data provided below - never invent specs.
Write a concise comparison (max 150 words) highlighting the key differences and which product suits which use case.

Products: ${JSON.stringify(
    products.map((p) => ({
      name: p.name,
      brand: p.brand,
      price: p.price,
      specifications: p.specifications,
      useCases: p.useCases,
      rating: p.rating,
    }))
  )}`;

  try {
    console.log('[gemini] generateComparison: request started');
    const text = await generateText(prompt);
    console.log('[gemini] generateComparison: request succeeded');
    return text.trim();
  } catch (error) {
    const { code } = classifyGeminiError(error);
    console.error(`[gemini] generateComparison: request failed (${code}):`, error.message);
    return null;
  }
};

/**
 * Answers a laptop-focused chatbot question, grounded in a short list of
 * real product records (or none, for general "what's the difference
 * between X and Y" questions). Gemini is explicitly told never to invent
 * a spec that isn't in the supplied data.
 *
 * Unlike the three functions above, this one THROWS a classified error on
 * failure instead of swallowing it - the chatbot is the one place the
 * project owner specifically wants real errors surfaced (status codes,
 * diagnostics) rather than a silently-generic fallback.
 */
const answerChatQuestion = async (userMessage, contextProducts = []) => {
  const productContext = contextProducts.length
    ? JSON.stringify(
        contextProducts.map((p) => ({
          name: p.name,
          brand: p.brand,
          price: p.price,
          specifications: p.specifications,
          graphicsDetails: p.graphicsDetails,
          displayDetails: p.displayDetails,
          batteryDetails: p.batteryDetails,
          useCases: p.useCases,
          rating: p.rating,
        }))
      )
    : 'No specific products were retrieved for this question.';

  const prompt = `You are the SmartCart laptop assistant - a friendly, plain-language expert who helps people (including complete beginners) understand laptops and pick the right one.

Ground rules (follow strictly):
- Only state a specific product's specifications if they appear in "Relevant products" below. If asked about a product/spec not listed there, say you don't have that information rather than guessing.
- You CAN explain general laptop concepts (what RAM does, GPU tiers, SSD vs HDD, etc.) from general knowledge - that's not product-specific data.
- Keep answers short, plain-language, and beginner-friendly. Avoid unexplained jargon; briefly define any technical term you use.
- If recommending a product, only recommend ones present in "Relevant products".
- Never invent a price, spec, or product name.

Relevant products (real catalog data, if any): ${productContext}

User question: """${userMessage}"""

Answer in 2-5 short sentences or a brief bullet list.`;

  console.log('[gemini] chat: request started');
  try {
    const text = await generateText(prompt);
    console.log('[gemini] chat: request succeeded');
    return text.trim();
  } catch (error) {
    const classified = classifyGeminiError(error);
    // Never log the key itself - only the classified code and the SDK's
    // own (key-free) error message.
    console.error(`[gemini] chat: request failed (${classified.code}):`, error.message);
    const thrown = new Error(classified.message);
    thrown.httpStatus = classified.httpStatus;
    thrown.code = classified.code;
    throw thrown;
  }
};

module.exports = {
  extractRequirements,
  generateMatchExplanation,
  generateComparison,
  answerChatQuestion,
  validateRequirements,
  classifyGeminiError,
};
