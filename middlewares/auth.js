const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Use JWT secret from environment variables, fallback to default
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Authentication middleware to protect routes
 * - Verifies JWT from cookies or headers
 * - Fetches user from DB
 * - Attaches user object to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Extract token (from cookies or "Authorization: Bearer <token>")
    const token =
      req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided, Unauthorized" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Find user in DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found, Unauthorized" });
    }

    // ✅ Attach user object to req
    req.user = user;

    // Continue to next middleware
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please log in again" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token, Unauthorized" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = authMiddleware;
