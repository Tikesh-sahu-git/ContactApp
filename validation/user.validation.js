const Joi = require("joi");

// ======================= SCHEMAS =======================

// Signup validation schema
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$"))
    .message("Password must include uppercase, lowercase, number, and special character")
    .required(),
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
});

// OTP validation schema
const otpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

// ======================= GENERIC VALIDATOR =======================
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  next();
};

// ======================= EXPORTS =======================
module.exports = {
  signup: validate(signupSchema),
  login: validate(loginSchema),
  verifyOtp: validate(otpSchema),
  resendOtp: validate(Joi.object({ email: Joi.string().email().lowercase().required() })),
};
