const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Not required at the schema level: a brand-new registration starts
    // as an email-only, unverified document (no name/password yet) and
    // only gets these filled in by /complete-registration, AFTER OTP
    // verification. Presence/length is validated explicitly in the
    // controllers at the point each field is actually collected.
    name: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // --- Email verification (OTP) ---
    // A pending (unverified) registration is just a User doc with
    // emailVerified: false. We never create a "real" duplicate account -
    // registering again with the same unverified email overwrites the
    // pending OTP rather than creating a second document.
    emailVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      select: false, // never returned in API responses
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpLastSentAt: {
      type: Date,
      select: false,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

// Hash the password before saving, only if it changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// --- OTP helpers ---
// OTP is hashed with bcrypt before storage, same as the password, so the
// raw 6-digit code is never persisted anywhere.
userSchema.methods.setOTP = async function setOTP(rawOtp, ttlMinutes = 10) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(rawOtp, salt);
  this.otpExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  this.otpAttempts = 0;
  this.otpLastSentAt = new Date();
};

userSchema.methods.compareOTP = async function compareOTP(candidate) {
  if (!this.otpHash) return false;
  return bcrypt.compare(candidate, this.otpHash);
};

userSchema.methods.clearOTP = function clearOTP() {
  this.otpHash = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
  this.otpLastSentAt = undefined;
};

module.exports = mongoose.model('User', userSchema);
