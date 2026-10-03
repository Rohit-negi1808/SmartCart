const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');
const geminiService = require('../services/geminiService');
const { rankProducts, calculateMatchScore, buildFilterFromRequirements } = require('../utils/recommendationEngine');

// @route POST /api/ai/search
const aiSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Please describe what you are looking for' });
    }

    const requirements = await geminiService.extractRequirements(query);
    const filter = buildFilterFromRequirements(requirements);

    const candidates = await Product.find(filter).limit(200);
    const ranked = rankProducts(candidates, requirements).slice(0, 24);

    // Save search history for logged-in users only (optional feature).
    if (req.user) {
      SearchHistory.create({
        user: req.user._id,
        query,
        extractedRequirements: requirements,
        resultCount: ranked.length,
      }).catch((err) => console.error('Failed to save search history:', err.message));
    }

    res.json({
      success: true,
      message: ranked.length
        ? 'Products fetched successfully'
        : 'No products matched your requirements',
      data: {
        requirements,
        aiFailed: Boolean(requirements._aiFailed),
        products: ranked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/ai/explain
// Body: { productId, requirements }
const explainMatch = async (req, res, next) => {
  try {
    const { productId, requirements } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const req_ = requirements || {};
    const matchScore = calculateMatchScore(product.toObject(), req_);
    const aiExplanation = await geminiService.generateMatchExplanation(product, req_, matchScore);

    // Rule-based fallback if Gemini is unavailable, so the feature never breaks.
    const fallbackBullets = buildFallbackExplanation(product, req_);

    res.json({
      success: true,
      message: 'Explanation generated successfully',
      data: {
        matchScore,
        explanation: aiExplanation || fallbackBullets,
        source: aiExplanation ? 'gemini' : 'rule-based',
      },
    });
  } catch (error) {
    next(error);
  }
};

const buildFallbackExplanation = (product, requirements) => {
  const lines = [];
  if (requirements.maxPrice && product.price <= requirements.maxPrice) {
    lines.push(`- Fits within your budget of ₹${requirements.maxPrice.toLocaleString('en-IN')}`);
  }
  if (requirements.minRam && product.specifications.ram >= requirements.minRam) {
    lines.push(`- Has ${product.specifications.ram}GB RAM, meeting your ${requirements.minRam}GB requirement`);
  }
  if (requirements.storageType && product.specifications.storageType === requirements.storageType) {
    lines.push(`- Uses ${product.specifications.storageType} storage as requested`);
  }
  if (requirements.gpuPreference && requirements.gpuPreference !== 'basic') {
    const tier = product.graphicsDetails?.performanceTier || 1;
    if (tier >= 3) {
      lines.push(`- Has a dedicated ${product.specifications.gpu} for the graphics performance you asked for`);
    }
  }
  if (requirements.useCase && product.useCases.includes(requirements.useCase)) {
    lines.push(`- Well suited for ${requirements.useCase.replace('-', ' ')}`);
  }
  if (product.rating >= 4) {
    lines.push(`- Highly rated at ${product.rating}/5 from ${product.reviewCount} reviews`);
  }
  if (lines.length === 0) {
    lines.push('- Matches the general category of your search');
  }
  return lines.join('\n');
};

// @route POST /api/ai/compare
// Body: { productIds: [id1, id2, id3] }
const aiCompare = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({ success: false, message: 'Provide between 2 and 4 productIds to compare' });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length < 2) {
      return res.status(404).json({ success: false, message: 'Could not find enough products to compare' });
    }

    const comparison = await geminiService.generateComparison(products);

    res.json({
      success: true,
      message: 'Comparison generated successfully',
      data: {
        comparison: comparison || 'AI comparison is temporarily unavailable. Please review the specification table above.',
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { aiSearch, explainMatch, aiCompare };
