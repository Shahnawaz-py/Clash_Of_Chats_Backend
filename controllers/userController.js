const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// @desc    Get all users or search users
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const search = req.query.search
      ? {
          $or: [
            { username: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    let queryFilter = {
      ...search,
      _id: { $ne: req.user._id },
    };

    // If current user is a registered user (not demo) AND NOT searching,
    // only show demo users AND accepted friends in default roster list!
    if (currentUser && !currentUser.isDemoUser && !req.query.search) {
      queryFilter.$or = [
        { isDemoUser: true },
        { _id: { $in: currentUser.friends || [] } },
      ];
    }

    const users = await User.find(queryFilter).select('-password');

    // Fetch friend requests involving current user to compute friendStatus
    const friendRequests = await FriendRequest.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
      status: 'pending',
    });

    const friendsSet = new Set(
      (currentUser?.friends || []).map((fId) => String(fId))
    );

    const usersWithStatus = users.map((u) => {
      const uObj = u.toObject();
      const uIdStr = String(u._id);

      if (u.isDemoUser) {
        uObj.friendStatus = 'demo';
      } else if (friendsSet.has(uIdStr)) {
        uObj.friendStatus = 'friend';
      } else {
        const reqSent = friendRequests.find(
          (fr) => String(fr.sender) === String(req.user._id) && String(fr.recipient) === uIdStr
        );
        const reqReceived = friendRequests.find(
          (fr) => String(fr.recipient) === String(req.user._id) && String(fr.sender) === uIdStr
        );

        if (reqSent) {
          uObj.friendStatus = 'pending_sent';
          uObj.friendRequestId = reqSent._id;
        } else if (reqReceived) {
          uObj.friendStatus = 'pending_received';
          uObj.friendRequestId = reqReceived._id;
        } else {
          uObj.friendStatus = 'none';
        }
      }
      return uObj;
    });

    res.json(usersWithStatus);
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
