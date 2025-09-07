const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const ENV = require('./config/env');
const passportConfig = require('./config/passport');

const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// ---------------------------
// Middleware
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security headers
app.use(helmet());

// ---------------------------
// General rate limiting
// ---------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use(generalLimiter);

// ---------------------------
// Strict rate limiter for auth routes
// ---------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per 15 mins per IP
  message: 'Too many login/signup attempts from this IP, please try again later',
});

// CORS
app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));

// Sessions (needed for Passport Google OAuth)
app.use(session({
  secret: ENV.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport); // configure Google Strategy

// ---------------------------
// Routes
// ---------------------------
// Apply stricter limiter to auth routes only
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', contactRoutes);

// Root
app.get('/', (req, res) => res.send('✅ Contact App API is running'));



// ---------------------------
// Error Handler
// ---------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
