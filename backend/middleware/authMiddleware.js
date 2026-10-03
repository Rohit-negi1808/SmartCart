const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent in the Authorization header and attaches the
// authenticated user (without password) to req.user.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user no longer exists' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email to access this feature' });
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired, please log in again'
        : 'Not authorized, invalid token';
    return res.status(401).json({ success: false, message });
  }
};

// Restricts a route to admin users. Must be used after `protect`.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

// Attaches req.user if a valid token is present, but never blocks the
// request if it's missing/invalid. Used for routes like AI search that
// work for guests but personalize (search history) for logged-in users.
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.emailVerified) req.user = user;
    next();
  } catch (error) {
    next(); // silently ignore bad tokens for optional auth
  }
};

module.exports = { protect, adminOnly, optionalAuth };
