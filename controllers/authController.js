const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_warband_clash_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new warrior
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { username, email, password, avatar, avatarName } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide all required fields (username, email, password)' });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: 'A warrior with this email or handle already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      avatar: avatar || 'Chieftain',
      avatarName: avatarName || 'Barbarian Chieftain (Fur & Leather Helm)',
      isOnline: true,
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarName: user.avatarName,
        trophies: user.trophies,
        level: user.level,
        role: user.role,
        isOnline: user.isOnline,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid warrior data' });
    }
  } catch (error) {
    console.error('[Signup Error]', error);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
};

// @desc    Authenticate warrior & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { emailOrTag, password } = req.body;

    if (!emailOrTag || !password) {
      return res
        .status(400)
        .json({ message: 'Please enter your email/tag and passphrase' });
    }

    const cleanInput = emailOrTag.trim().toLowerCase();

    // Check by email or username
    const user = await User.findOne({
      $or: [{ email: cleanInput }, { username: new RegExp(`^${cleanInput}$`, 'i') }],
    });

    if (user && (await user.matchPassword(password))) {
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      const token = generateToken(user._id);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarName: user.avatarName,
        trophies: user.trophies,
        level: user.level,
        role: user.role,
        isOnline: user.isOnline,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials or passphrase' });
    }
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current logged in warrior profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
