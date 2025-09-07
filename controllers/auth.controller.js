const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/otp");
const sendEmail = require("../utils/sendEmail");
const rateLimit = require("express-rate-limit");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;

// ------------------- RATE LIMITER -------------------
// Limit OTP requests: max 5 per email per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.email, // limit by email
  message: "Too many OTP requests for this email. Try again later.",
});

// ------------------- HELPER FUNCTIONS -------------------

// Generate numeric OTP
const generateOtp = () => crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH - 1);

// Send OTP email
const sendOtpEmail = async (email, name, otp) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
      /* Modern CSS Reset */
      *, *::before, *::after {
        box-sizing: border-box;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: #f7f9fc;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #333;
        line-height: 1.6;
      }
      
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0,  ̈0.08);
      }

      /* Header with gradient */
      .header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c73e6 100%);
        color: #fff;
        text-align: center;
        padding: 30px 20px;
      }
      
      .logo {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin: 0 0 5px 0;
      }
      
      .tagline {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
        font-weight: 300;
      }

      /* Main content */
      .content {
        padding: 40px 30px;
      }
      
      .greeting {
        font-size: 18px;
        margin-bottom: 25px;
        color: #2d3748;
      }
      
      .message {
        font-size: 16px;
        margin-bottom: 30px;
        color: #4a5568;
        line-height: 1.6;
      }
      
      .otp-container {
        margin: 35px 0;
        text-align: center;
      }
      
      .otp-label {
        font-size: 14px;
        color: #718096;
        margin-bottom: 10px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-weight: 600;
      }
      
      .otp-code {
        font-size: 42px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #4f46e5;
        background: #f7f9fc;
        padding: 20px;
        border-radius: 12px;
        border: 1px dashed #e2e8f0;
        margin: 15px 0;
        display: inline-block;
        text-align: center;
        min-width: 280px;
      }
      
      .validity {
        font-size: 14px;
        color: #e53e3e;
        margin-top: 10px;
        font-weight: 500;
      }
      
      .secondary-message {
        font-size: 14px;
        color: #718096;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #edf2f7;
      }

      /* Footer */
      .footer {
        background-color: #f7f9fc;
        padding: 25px 20px;
        text-align: center;
        font-size: 13px;
        color: #a0aec0;
      }
      
      .footer-links {
        margin-bottom: 15px;
      }
      
      .footer-link {
        color: #4f46e5;
        text-decoration: none;
        margin: 0 12px;
        font-size: 13px;
      }
      
      .footer-link:hover {
        text-decoration: underline;
      }
      
      .copyright {
        margin-top: 15px;
      }

      /* Responsive Design */
      @media screen and (max-width: 640px) {
        .container {
          margin: 20px 15px;
          border-radius: 12px;
        }
        
        .header {
          padding: 25px 15px;
        }
        
        .logo {
          font-size: 24px;
        }
        
        .content {
          padding: 30px 20px;
        }
        
        .otp-code {
          font-size: 32px;
          letter-spacing: 6px;
          padding: 15px;
          min-width: 240px;
        }
        
        .footer {
          padding: 20px 15px;
        }
        
        .footer-link {
          display: block;
          margin: 8px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">My Contact App</div>
        <div class="tagline">Keeping your connections secure</div>
      </div>
      
      <div class="content">
        <h1 class="greeting">Hello, ${name}!</h1>
        
        <p class="message">
          To complete your verification process, please use the One-Time Password (OTP) below. 
          This code will expire in <strong>10 minutes</strong> for your security.
        </p>
        
        <div class="otp-container">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="validity">⚠️ Expires in 10 minutes</div>
        </div>
        
        <p class="secondary-message">
          If you didn't request this code, please ignore this email or contact our support team 
          if you have any concerns about your account security.
        </p>
      </div>
      
      <div class="footer">
        <div class="footer-links">
          <a href="#" class="footer-link">Help Center</a>
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Service</a>
        </div>
        <div class="copyright">
          &copy; ${new Date().getFullYear()} My Contact App. All rights reserved.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await sendEmail(email, "OTP Verification", html);
};


// Generate JWT token
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ------------------- CONTROLLERS -------------------

// SIGNUP WITH OTP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({ name, email, password: hashedPassword, isVerified: false });

    // Delete old OTPs if any
    await Otp.deleteMany({ email });

    // Generate and save OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY);
    await Otp.create({ email, otp, expiresAt });

    // Send OTP email
    await sendOtpEmail(email, name, otp);

    res.status(201).json({ message: "User registered. OTP sent to email", userId: user._id });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    // Find OTP in DB
    const otpEntry = await Otp.findOne({ email });
    if (!otpEntry) return res.status(400).json({ message: "OTP expired or not found" });

    if (parseInt(otp) !== otpEntry.otp) return res.status(400).json({ message: "Invalid OTP" });

    // Delete OTP after verification
    await Otp.deleteOne({ _id: otpEntry._id });

    // Update user as verified
    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate JWT
    const token = generateToken(user);

    res.json({ message: "Account verified successfully", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("OTP Verification Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// RESEND OTP
exports.resendOtp = [
  otpLimiter, // Apply rate limiting
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.isVerified) return res.status(400).json({ message: "User already verified" });

      // Delete old OTPs
      await Otp.deleteMany({ email });

      // Generate new OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY);
      await Otp.create({ email, otp, expiresAt });

      // Send email
      await sendOtpEmail(email, user.name, otp);

      res.json({ message: "OTP resent successfully" });
    } catch (err) {
      console.error("Resend OTP Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(401).json({ message: "Please verify your account first" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.json({ message: "Logout successful. Delete token client-side." });
};
