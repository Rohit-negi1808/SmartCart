const Product = require('../models/Product');
const geminiService = require('../services/geminiService');
const { buildFilterFromRequirements, rankProducts } = require('../utils/recommendationEngine');

const MAX_CONTEXT_PRODUCTS = 5;

// Finds products relevant to a chat message so Gemini can be grounded in
// real catalog data rather than answering from general knowledge alone.
// Two lookup strategies, tried in order:
//  1. If the message names a specific product (brand/model keyword match),
//     surface that exact product.
//  2. Otherwise, treat it like a mini AI-search: extract requirements and
//     pull/rank matching products, so "which laptops under 70k have 16GB
//     RAM" gets real, current catalog answers.
const findRelevantProducts = async (message, requirements) => {
  const textMatches = await Product.find({ $text: { $search: message } })
    .limit(MAX_CONTEXT_PRODUCTS)
    .catch(() => []);

  if (textMatches && textMatches.length > 0) {
    return textMatches;
  }

  const hasUsableRequirements = Object.entries(requirements || {}).some(
    ([key, value]) => key !== 'category' && key !== '_aiFailed' && value !== null
  );
  if (!hasUsableRequirements) return [];

  const filter = buildFilterFromRequirements(requirements);
  const candidates = await Product.find(filter).limit(50);
  return rankProducts(candidates, requirements).slice(0, MAX_CONTEXT_PRODUCTS);
};

// @route POST /api/chat
// Body: { message, history? }
// A single-turn (optionally history-aware) endpoint for the laptop
// chatbot widget. Always grounded in real MongoDB product data - never
// lets Gemini invent specs, and says so explicitly when data is missing.
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    console.log('[chat] request reached /api/chat');

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'A message is required' });
    }

    // Reuse the same requirement-extraction Gemini already does for AI
    // search, so "which laptops under 70k have 16GB RAM" and similar
    // questions can be answered from real, current catalog data. This
    // call degrades gracefully on its own (see geminiService.js), so a
    // Gemini failure here does not block the chat reply below.
    const requirements = await geminiService.extractRequirements(message);
    const relevantProducts = await findRelevantProducts(message, requirements);

    let reply;
    try {
      reply = await geminiService.answerChatQuestion(message, relevantProducts);
    } catch (aiError) {
      // Surface the REAL cause with a meaningful status code instead of
      // hiding it behind one generic message - see geminiService.js'
      // classifyGeminiError for what each code means.
      return res.status(aiError.httpStatus || 502).json({
        success: false,
        message: aiError.message || 'The AI assistant is temporarily unavailable.',
        code: aiError.code || 'unknown',
      });
    }

    res.json({
      success: true,
      message: 'Chat reply generated',
      data: {
        reply,
        referencedProducts: relevantProducts.map((p) => ({ id: p._id, name: p.name, price: p.price })),
        aiAvailable: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
