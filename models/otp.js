const mongoose = require("mongoose");

// ======================= OTP SCHEMA =======================
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Automatically delete expired OTPs (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
