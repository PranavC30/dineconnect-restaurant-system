const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: false }, // Not required for Google users
  role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
  isActive: { type: Boolean, default: true },
  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  isGoogleUser: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
