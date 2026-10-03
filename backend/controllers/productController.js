const Product = require('../models/Product');

// @route GET /api/products
// Supports pagination + filtering + sorting via query params so the
// frontend never has to download the entire catalog.
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRam,
      storageType,
      processor,
      minRating,
      useCase,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.category = category;
    if (brand) filter.brand = { $in: brand.split(',') };
    if (useCase) filter.useCases = useCase;
    if (storageType) filter['specifications.storageType'] = storageType;
    if (processor) filter['specifications.processor'] = { $regex: processor, $options: 'i' };
    if (minRam) filter['specifications.ram'] = { $gte: Number(minRam) };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 }; // relevance/default
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Products fetched successfully',
      data: products,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product fetched successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/meta/filters
// Returns the distinct brands/processors available, to populate filter UI.
const getFilterOptions = async (req, res, next) => {
  try {
    const [brands, processors] = await Promise.all([
      Product.distinct('brand'),
      Product.distinct('specifications.processor'),
    ]);
    res.json({
      success: true,
      message: 'Filter options fetched successfully',
      data: { brands: brands.sort(), processors: processors.sort() },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/products (admin only)
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/products/:id (admin only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/products/:id (admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getFilterOptions,
  createProduct,
  updateProduct,
  deleteProduct,
};
