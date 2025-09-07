const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, index: true },
    picture: String, // Cloudinary URL
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Add pagination plugin
contactSchema.plugin(mongoosePaginate);

// Optional: Full-text index for search (name, email, phone)
contactSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model("Contact", contactSchema);
