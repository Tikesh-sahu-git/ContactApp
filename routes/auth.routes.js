const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const userValid = require('../validation/user.validation');
const {
  signup,
  login,
  logout,
  verifyOtp,
  resendOtp
} = require('../controllers/auth.controller'); // updated controller
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,                    // limit to 5 OTP requests per email per 10 mins
  message: "Too many OTP requests, please try again later"
});

require('../config/passport')(passport); // Google OAuth setup

const router = express.Router();

// ---------------- Local Auth ----------------
// ---------------- Local Auth ----------------
router.post('/signup', userValid.signup, signup);  // Sign up with OTP
router.post('/verify-otp', otpLimiter, userValid.verifyOtp, verifyOtp); // Verify OTP with rate-limit
router.post('/resend-otp', otpLimiter, userValid.resendOtp, resendOtp); // Resend OTP with rate-limit
router.post('/login', userValid.login, login);  // Login only for verified users
router.get('/logout', logout);

// ---------------- Google OAuth ----------------
// Step 1: Redirect to Google login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    try {
      const user = req.user; // From GoogleStrategy

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (err) {
      console.error('Google login error:', err);
      res.redirect('/login?error=OAuthFailed');
    }
  }
);

module.exports = router;
