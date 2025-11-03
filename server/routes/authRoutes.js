const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "customer"
    });

    res.json({ message: "Registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ 
    message: "Login successful", 
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture
    }
  });
});

// GOOGLE LOGIN
router.post("/google-login", async (req, res) => {
  try {
    const { email, name, picture, googleId, role } = req.body;

    console.log('🔍 Google login attempt:', { email, name, googleId });

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture;
        await user.save();
      }
      console.log('✅ Existing user found:', user.email);
    } else {
      // Create new user with Google data
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        role: role || "customer",
        passwordHash: null, // No password for Google users
        isGoogleUser: true
      });
      console.log('✅ New Google user created:', user.email);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        name: user.name,
        email: user.email,
        picture: user.picture 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "Google login successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({ message: "Google login failed", error: error.message });
  }
});

module.exports = router;
