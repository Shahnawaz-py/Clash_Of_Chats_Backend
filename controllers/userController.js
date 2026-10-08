const User = require('../models/User');

// @desc    Get all users or search users
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const search = req.query.search
      ? {
          $or: [
            { username: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find({
      ...search,
      _id: { $ne: req.user._id },
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('[Get Users Error]', error);
    res.status(500).json({ message: 'Server error fetching warriors list' });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Warrior not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching warrior profile' });
  }
};

// @desc    Update user profile (username, avatar, avatarName, bannerPattern, description)
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Warrior not found' });
    }

    const { username, avatar, avatarName, bannerPattern, bannerUrl, bannerTitle, bannerFilter, description } = req.body;

    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Warrior name is already taken by another comrade' });
      }
      user.username = username.trim();
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (avatarName !== undefined) user.avatarName = avatarName;
    if (bannerPattern !== undefined) user.bannerPattern = bannerPattern;
    if (bannerUrl !== undefined) user.bannerUrl = bannerUrl.trim();
    if (bannerTitle !== undefined) user.bannerTitle = bannerTitle.trim();
    if (bannerFilter !== undefined) user.bannerFilter = bannerFilter;
    if (description !== undefined) user.description = description.trim();

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('[Update User Profile Error]', error);
    res.status(500).json({ message: 'Error updating warrior profile' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserProfile,
};
