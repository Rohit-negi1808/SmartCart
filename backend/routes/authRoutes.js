const express = require('express');
const { register, login, getMe, verifyOtp, resendOtp, completeRegistration } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Step 1: email only -> OTP sent
router.post('/register', register);
// Step 2: OTP verified -> short-lived registrationToken returned
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
// Step 3: name + password, authorized by the registrationToken from step 2
// (verified inline in the controller, not via the `protect` middleware -
// that token is intentionally NOT a normal session token).
router.post('/complete-registration', completeRegistration);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
