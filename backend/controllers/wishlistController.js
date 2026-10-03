const User = require('../models/User');
const Product = require('../models/Product');

// @route GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, message: 'Wishlist fetched successfully', data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/wishlist/:productId
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    const alreadySaved = user.wishlist.some((id) => id.toString() === productId);
    if (!alreadySaved) {
      user.wishlist.push(productId);
      await user.save();
    }

    res.json({ success: true, message: 'Product added to wishlist', data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    res.json({ success: true, message: 'Product removed from wishlist', data: user.wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
