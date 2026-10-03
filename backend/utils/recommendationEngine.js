// Single source of truth for match-score weighting. Two things live here:
//
// 1. BASE_WEIGHTS - the default weighting when we don't know the user's
//    use case.
// 2. USE_CASE_WEIGHTS - per-use-case overrides, because "what matters"
//    genuinely differs by intent (a gaming laptop lives and dies by its
//    GPU; a student laptop lives and dies by price/battery/weight). This
//    is intentionally NOT a single universal formula.
//
// Adjust weights here only - no scoring logic is duplicated elsewhere.

const BASE_WEIGHTS = {
  price: 0.25,
  ram: 0.15,
  gpu: 0.15,
  useCase: 0.15,
  storage: 0.1,
  battery: 0.1,
  rating: 0.1,
};

// Each override replaces the matching key(s) in BASE_WEIGHTS; the rest
// are inherited. All six categories should still sum to ~1 for a given
// use case - see normalizeWeights() below, which enforces that.
const USE_CASE_WEIGHTS = {
  programming: { price: 0.2, ram: 0.25, gpu: 0.05, useCase: 0.15, storage: 0.2, battery: 0.05, rating: 0.1 },
  gaming: { price: 0.15, ram: 0.15, gpu: 0.35, useCase: 0.15, storage: 0.05, battery: 0.05, rating: 0.1 },
  'video-editing': { price: 0.15, ram: 0.2, gpu: 0.25, useCase: 0.15, storage: 0.15, battery: 0.0, rating: 0.1 },
  student: { price: 0.35, ram: 0.1, gpu: 0.0, useCase: 0.1, storage: 0.1, battery: 0.25, rating: 0.1 },
  business: { price: 0.25, ram: 0.1, gpu: 0.0, useCase: 0.1, storage: 0.1, battery: 0.25, rating: 0.2 },
  general: BASE_WEIGHTS,
};

const normalizeWeights = (weights) => {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) return weights;
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
};

const getWeightsForUseCase = (useCase) => {
  const raw = (useCase && USE_CASE_WEIGHTS[useCase]) || BASE_WEIGHTS;
  return normalizeWeights(raw);
};

const BATTERY_RANK = { low: 1, medium: 2, high: 3 };
const GPU_RANK = { basic: 1, mid: 3, high: 5 }; // maps a user's plain-language GPU ask to a target performanceTier

// Roughly buckets a free-text battery description into low/medium/high.
const inferBatteryRank = (batteryText = '') => {
  const match = batteryText.match(/(\d+)/);
  const hours = match ? parseInt(match[1], 10) : null;
  if (hours === null) return 2;
  if (hours >= 10) return 3;
  if (hours >= 6) return 2;
  return 1;
};

// GPU strength comes from the deterministic `graphicsDetails.performanceTier`
// (1-5) set at seed/admin-entry time - never guessed from a free-text model
// name at query time. Falls back to 1 (basic/integrated) if not set.
const getGpuTier = (product) => product.graphicsDetails?.performanceTier || 1;

const scorePrice = (product, req) => {
  if (!req.maxPrice) return 0.7;
  if (product.price > req.maxPrice) {
    const overBy = (product.price - req.maxPrice) / req.maxPrice;
    return Math.max(0, 0.5 - overBy);
  }
  const ratio = product.price / req.maxPrice;
  return 0.7 + ratio * 0.3;
};

const scoreRam = (product, req) => {
  const ram = product.specifications?.ram || 0;
  if (!req.minRam) return 0.7;
  if (ram >= req.minRam) return Math.min(1, 0.8 + (ram - req.minRam) * 0.02);
  return Math.max(0, ram / req.minRam);
};

const scoreGpu = (product, req) => {
  const tier = getGpuTier(product);
  if (!req.gpuPreference) {
    // No explicit GPU ask - a stronger GPU is still a mild positive,
    // never a penalty (e.g. a student who didn't mention gaming
    // shouldn't be punished for a laptop that happens to have a GPU).
    return 0.6 + tier * 0.06;
  }
  const desiredTier = GPU_RANK[req.gpuPreference] || 3;
  if (tier >= desiredTier) return 1;
  const diff = desiredTier - tier;
  return Math.max(0.1, 1 - diff * 0.25);
};

const scoreUseCase = (product, req) => {
  if (!req.useCase) return 0.7;
  return product.useCases?.includes(req.useCase) ? 1 : 0.25;
};

const scoreStorage = (product, req) => {
  const storage = product.specifications?.storage || 0;
  let score = 0.7;
  if (req.minStorage) {
    score = storage >= req.minStorage ? 1 : Math.max(0, storage / req.minStorage);
  }
  if (req.storageType && product.specifications?.storageType !== req.storageType) {
    score *= 0.6;
  }
  return score;
};

const scoreBattery = (product, req) => {
  if (!req.batteryPreference) return 0.7;
  const productRank = inferBatteryRank(product.specifications?.battery);
  const desiredRank = BATTERY_RANK[req.batteryPreference] || 2;
  const diff = Math.abs(productRank - desiredRank);
  if (diff === 0) return 1;
  if (diff === 1) return 0.6;
  return 0.3;
};

const scoreRating = (product) => {
  const rating = product.rating || 0;
  return Math.min(1, rating / 5);
};

/**
 * Calculates a 0-100 match score for a product against extracted
 * requirements. Weighting adapts to requirements.useCase (Part 5) -
 * e.g. a gaming request weighs GPU far more heavily than a student
 * request does. Falls back to a balanced default when useCase is
 * unknown.
 */
const calculateMatchScore = (product, requirements) => {
  const req = requirements || {};
  const weights = getWeightsForUseCase(req.useCase);

  const subScores = {
    price: scorePrice(product, req),
    ram: scoreRam(product, req),
    gpu: scoreGpu(product, req),
    useCase: scoreUseCase(product, req),
    storage: scoreStorage(product, req),
    battery: scoreBattery(product, req),
    rating: scoreRating(product),
  };

  const weightedSum = Object.keys(weights).reduce(
    (sum, key) => sum + (subScores[key] ?? 0) * weights[key],
    0
  );

  return Math.round(weightedSum * 100);
};

const rankProducts = (products, requirements) => {
  return products
    .map((p) => {
      const plain = typeof p.toObject === 'function' ? p.toObject() : p;
      return { ...plain, matchScore: calculateMatchScore(plain, requirements) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Builds a Mongo filter from validated, extracted requirements. Shared by
// /api/ai/search and the chatbot's product lookup so there's exactly one
// place that decides which fields are hard filters vs. soft-scored.
// Kept intentionally loose (some price headroom) so a slightly over-budget
// but otherwise great match can still surface and be scored down rather
// than hidden entirely.
const buildFilterFromRequirements = (req) => {
  const filter = { category: req.category || 'laptop' };

  if (req.maxPrice) {
    filter.price = { ...(filter.price || {}), $lte: Math.round(req.maxPrice * 1.15) };
  }
  if (req.minPrice) {
    filter.price = { ...(filter.price || {}), $gte: req.minPrice };
  }
  if (req.brand) {
    filter.brand = { $regex: req.brand, $options: 'i' };
  }
  // RAM/storage/useCase/GPU/battery are intentionally NOT hard filters -
  // they feed the scoring engine instead of over-filtering to zero results.

  return filter;
};

module.exports = {
  calculateMatchScore,
  rankProducts,
  buildFilterFromRequirements,
  BASE_WEIGHTS,
  USE_CASE_WEIGHTS,
  getWeightsForUseCase,
};
