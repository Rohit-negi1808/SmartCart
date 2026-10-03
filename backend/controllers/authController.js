const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail, OTP_TTL_MINUTES } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// A short-lived, purpose-scoped token - NOT a login session. It proves
// "this request just passed OTP verification for this email" and is
// only ever accepted by /complete-registration, nowhere else in the app.
const signRegistrationToken = (id) =>
  jwt.sign({ id, purpose: 'complete-registration' }, process.env.JWT_SECRET, { expiresIn: '15m' });

const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);

// A deliberately stricter check than a bare "has an @" test - rejects
// arbitrary strings while accepting normal Gmail/Outlook/Hotmail/etc.
// addresses. Not a full RFC 5322 parser (nothing simple is), but catches
// the obvious garbage without needing an extra dependency.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const isValidEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
});

// ===================================================================
// Step 1 of 3: email only.
// ===================================================================
// @route POST /api/auth/register
// Body: { email }
// Creates (or reuses) an email-only, unverified, PASSWORD-LESS User
// document and sends an OTP. No name, no password, no token issued
// here - there is nothing "usable" yet. This is intentionally the only
// thing that happens before the user proves they control the inbox.
const register = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && existing.emailVerified && existing.password) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Either brand-new, or a previous attempt that never finished
    // verification/completion - reuse the same doc rather than creating
    // a duplicate. Explicitly do NOT touch name/password here.
    const user = existing || new User({ email: normalizedEmail });
    user.emailVerified = false;

    const otp = generateOTP();
    await user.setOTP(otp, OTP_TTL_MINUTES);

    try {
      await sendOTPEmail(normalizedEmail, otp, user.name || null);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
      return res.status(502).json({
        success: false,
        message: 'Could not send the verification email. Please check your address and try again shortly.',
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `A verification code was sent to ${normalizedEmail}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      data: { email: normalizedEmail },
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================================
// Step 2 of 3: verify the OTP.
// ===================================================================
// @route POST /api/auth/verify-otp
// Body: { email, otp }
// On success, marks emailVerified = true and returns a short-lived
// registrationToken for the final step - NEVER a full login token,
// because no password exists yet (the account still isn't usable).
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpHash +otpExpires +otpAttempts +otpLastSentAt +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No pending registration found for this email' });
    }

    // Edge case: this email was already fully verified AND completed
    // (has a password) - nothing left to verify, send them to log in.
    if (user.emailVerified && user.password) {
      return res.status(400).json({ success: false, message: 'This email is already verified. Please log in.' });
    }

    if (!user.otpHash || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No active OTP. Please request a new one.' });
    }
    if (user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new one.' });
    }
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const isMatch = await user.compareOTP(String(otp).trim());
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - user.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Email ownership proven. Mark it verified - this is step 2's ONLY
    // job. Name/password/account-creation happen in step 3, not here.
    user.emailVerified = true;
    user.clearOTP();
    await user.save();

    const registrationToken = signRegistrationToken(user._id);
    res.json({
      success: true,
      message: 'Email verified. Please set your name and password to finish creating your account.',
      data: { email: user.email, registrationToken },
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================================
// Step 3 of 3: set name + password, account becomes usable.
// ===================================================================
// @route POST /api/auth/complete-registration
// Header: Authorization: Bearer <registrationToken>  (from verify-otp)
// Body: { name, password, confirmPassword }
// This is the ONLY place a password gets set on a new account, and it
// requires the short-lived registrationToken proving OTP was already
// verified. Only after this succeeds does a real login JWT get issued.
const completeRegistration = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid verification session. Please verify your email again.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Your verification session expired. Please verify your email again.'
          : 'Invalid verification session. Please verify your email again.';
      return res.status(401).json({ success: false, message });
    }

    if (decoded.purpose !== 'complete-registration') {
      return res.status(401).json({ success: false, message: 'Invalid verification session. Please verify your email again.' });
    }

    const { name, password, confirmPassword } = req.body;
    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please register again.' });
    }
    if (!user.emailVerified) {
      // Should be unreachable (the token is only issued after
      // verification), but never trust a token's claims over the DB.
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email first.' });
    }
    if (user.password) {
      return res.status(400).json({ success: false, message: 'This account is already set up. Please log in.' });
    }

    user.name = name;
    user.password = password; // hashed by the pre-save hook
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user: publicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/resend-otp
// Body: { email }
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpLastSentAt +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No pending registration found for this email' });
    }
    if (user.emailVerified && user.password) {
      return res.status(400).json({ success: false, message: 'This email is already verified. Please log in.' });
    }

    if (user.otpLastSentAt) {
      const secondsSinceLast = (Date.now() - user.otpLastSentAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another OTP.` });
      }
    }

    const otp = generateOTP();
    await user.setOTP(otp, OTP_TTL_MINUTES); // invalidates the previous OTP
    user.emailVerified = false; // re-verifying resets this until the new OTP succeeds

    try {
      await sendOTPEmail(user.email, otp, user.name || null);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError.message);
      return res.status(502).json({ success: false, message: 'Could not send the verification email. Please try again shortly.' });
    }

    await user.save();
    res.json({ success: true, message: `A new verification code was sent to ${user.email}.`, data: { email: user.email } });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        data: { email: user.email, requiresVerification: true },
      });
    }

    if (!user.password) {
      // Email verified but step 3 (name + password) was never finished -
      // hand back a fresh registrationToken so they can pick up exactly
      // where they left off instead of re-verifying from scratch.
      return res.status(403).json({
        success: false,
        message: 'Please finish setting up your account (name and password).',
        data: { email: user.email, requiresCompletion: true, registrationToken: signRegistrationToken(user._id) },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: { token, user: publicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, message: 'User fetched successfully', data: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, verifyOtp, resendOtp, completeRegistration };
