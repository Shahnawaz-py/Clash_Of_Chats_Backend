const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// @desc    Send a friend request to a registered user
// @route   POST /api/friends/request
const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient warrior ID is required' });
    }

    if (String(senderId) === String(recipientId)) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Warrior not found' });
    }

    // Demo users do not require friend requests
    if (recipientUser.isDemoUser) {
      return res.status(400).json({
        message: 'Demo warriors do not require friend requests. You can chat with them directly.',
      });
    }

    // Check if current user is demo user
    if (req.user.isDemoUser) {
      return res.status(400).json({
        message: 'Demo accounts can message warriors directly without friend requests.',
      });
    }

    // Check if already friends
    const currentUser = await User.findById(senderId);
    const isAlreadyFriend = currentUser.friends?.some(
      (fId) => String(fId) === String(recipientId)
    );
    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'You are already friends with this warrior' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'A friend request is already pending between you two' });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends with this warrior' });
      }
      // If rejected previously, allow re-sending by updating or re-creating
      existingRequest.sender = senderId;
      existingRequest.recipient = recipientId;
      existingRequest.status = 'pending';
      await existingRequest.save();

      const populatedReq = await FriendRequest.findById(existingRequest._id)
        .populate('sender', 'username avatar avatarName role isDemoUser level trophies')
        .populate('recipient', 'username avatar avatarName role isDemoUser level trophies');

      return res.json({
        message: `Friend request sent to ${recipientUser.username}`,
        request: populatedReq,
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
      status: 'pending',
    });

    const populatedReq = await FriendRequest.findById(friendRequest._id)
      .populate('sender', 'username avatar avatarName role isDemoUser level trophies')
      .populate('recipient', 'username avatar avatarName role isDemoUser level trophies');

    res.status(201).json({
      message: `Friend request sent to ${recipientUser.username}`,
      request: populatedReq,
    });
  } catch (error) {
    console.error('[Send Friend Request Error]', error);
    res.status(500).json({ message: error.message || 'Error sending friend request' });
  }
};

// @desc    Get all pending friend requests (incoming and outgoing)
// @route   GET /api/friends/requests
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const incoming = await FriendRequest.find({
      recipient: userId,
      status: 'pending',
    })
      .populate('sender', 'username avatar avatarName role isOnline isDemoUser level trophies email')
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({
      sender: userId,
      status: 'pending',
    })
      .populate('recipient', 'username avatar avatarName role isOnline isDemoUser level trophies email')
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('[Get Friend Requests Error]', error);
    res.status(500).json({ message: 'Error fetching friend requests' });
  }
};

// @desc    Accept a friend request
// @route   POST /api/friends/accept/:requestId
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Search by FriendRequest _id OR sender ID where recipient is current user
    let friendRequest = await FriendRequest.findOne({
      $or: [
        { _id: requestId, recipient: userId, status: 'pending' },
        { sender: requestId, recipient: userId, status: 'pending' },
      ],
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found or already processed' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add each other to friends array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendRequest.sender },
    });

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: userId },
    });

    const populatedReq = await FriendRequest.findById(friendRequest._id)
      .populate('sender', 'username avatar avatarName role isOnline isDemoUser level trophies')
      .populate('recipient', 'username avatar avatarName role isOnline isDemoUser level trophies');

    res.json({
      message: 'Friend request accepted! You are now comrades in battle.',
      request: populatedReq,
    });
  } catch (error) {
    console.error('[Accept Friend Request Error]', error);
    res.status(500).json({ message: 'Error accepting friend request' });
  }
};

// @desc    Reject or cancel a friend request
// @route   POST /api/friends/reject/:requestId
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Search by FriendRequest _id OR sender/recipient ID
    const friendRequest = await FriendRequest.findOne({
      $or: [
        { _id: requestId, $or: [{ recipient: userId }, { sender: userId }] },
        { sender: requestId, recipient: userId },
        { sender: userId, recipient: requestId },
      ],
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    await FriendRequest.findByIdAndDelete(friendRequest._id);

    res.json({ message: 'Friend request removed' });
  } catch (error) {
    console.error('[Reject Friend Request Error]', error);
    res.status(500).json({ message: 'Error rejecting friend request' });
  }
};

// @desc    Get user\'s accepted friends
// @route   GET /api/friends
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      '-password'
    );
    res.json(user?.friends || []);
  } catch (error) {
    console.error('[Get Friends Error]', error);
    res.status(500).json({ message: 'Error fetching friends list' });
  }
};

// @desc    Remove a friend
// @route   DELETE /api/friends/:friendId
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Pull from both users' friends array
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    // Also delete any existing FriendRequest record between them
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, recipient: friendId },
        { sender: friendId, recipient: userId },
      ],
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('[Remove Friend Error]', error);
    res.status(500).json({ message: 'Error removing friend' });
  }
};

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
};

