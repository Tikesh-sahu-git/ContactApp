// config/env.js
const dotenv = require("dotenv");

// Load .env file
dotenv.config();

const ENV = {
  // Server
  PORT: process.env.PORT || 3000,
  APP_NAME: process.env.APP_NAME || "ContactApp",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Database
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/contactapp",

  // Auth & Security
  SESSION_SECRET: process.env.SESSION_SECRET || "supersecret",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "defaultjwtsecret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",
  JWT_COOKIE_NAME: process.env.JWT_COOKIE_NAME || "token",
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE || "30",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || "",

  // Email (SMTP)
  SMTP_SERVICE: process.env.SMTP_SERVICE || "gmail",
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  CORS_METHODS: process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE",
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === "true",
};

module.exports = ENV;
