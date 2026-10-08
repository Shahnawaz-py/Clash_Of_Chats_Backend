const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Clan = require('../models/Clan');

// @desc    Get user's conversations list
// @route   GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', '-password')
      .populate('clan')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('[Get Conversations Error]', error);
    res.status(500).json({ message: 'Error fetching conversations list' });
  }
};

// @desc    Get or create conversation with another warrior
// @route   POST /api/chat/conversations
const createOrGetConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, recipientId] },
    })
      .populate('participants', '-password')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [req.user._id, recipientId],
        unreadCounts: {},
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        '-password'
      );
    }

    res.json(conversation);
  } catch (error) {
    console.error('[Create Conversation Error]', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
};

// @desc    Get or create group conversation for a Clan
// @route   GET /api/chat/clan-conversation/:clanId
const getOrCreateClanConversation = async (req, res) => {
  try {
    const { clanId } = req.params;

    const clan = await Clan.findById(clanId).populate('members.user', 'username avatar level trophies role');
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    let conversation = await Conversation.findOne({ clan: clanId, isGroup: true })
      .populate('participants', '-password')
      .populate('clan')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      });

    // Extract all member user IDs
    const memberUserIds = clan.members.map((m) => m.user._id || m.user);

    if (!conversation) {
      // Create new group conversation for clan if missing
      conversation = await Conversation.create({
        isGroup: true,
        clan: clan._id,
        groupName: clan.name,
        groupAvatar: clan.shieldEmblem,
        participants: memberUserIds,
        unreadCounts: {},
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', '-password')
        .populate('clan');
    } else {
      // Sync participants if any new members joined
      let needsSave = false;
      memberUserIds.forEach((uid) => {
        if (!conversation.participants.some((p) => String(p._id || p) === String(uid))) {
          conversation.participants.push(uid);
          needsSave = true;
        }
      });

      if (needsSave) {
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
          .populate('participants', '-password')
          .populate('clan')
          .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'username avatar' },
          });
      }
    }

    res.json(conversation);
  } catch (error) {
    console.error('[Get Clan Conversation Error]', error);
    res.status(500).json({ message: 'Error loading clan group chat' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatar avatarName role')
      .populate('recipient', 'username avatar avatarName role')
      .sort({ createdAt: 1 });

    // Mark unread count as 0 for current user in conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
      conversation.unreadCounts.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.json(messages);
  } catch (error) {
    console.error('[Get Messages Error]', error);
    res.status(500).json({ message: 'Error fetching message history' });
  }
};

// @desc    Send a message (supports 1-on-1 and Group/Clan chats)
// @route   POST /api/chat/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, text } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ message: 'Conversation ID and message text are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    let messageData = {
      conversationId,
      sender: req.user._id,
      text: text.trim(),
      delivered: true,
      read: false,
    };

    if (conversation.isGroup) {
      // Group message - recipient is optional
      if (recipientId) messageData.recipient = recipientId;
    } else {
      // 1-on-1 message requires recipientId
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required for direct messages' });
      }
      messageData.recipient = recipientId;
    }

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar avatarName role')
      .populate('recipient', 'username avatar avatarName role');

    // Update conversation lastMessage & increment unread counts
    conversation.lastMessage = message._id;
    if (!conversation.unreadCounts) conversation.unreadCounts = new Map();

    if (conversation.isGroup) {
      // Increment unread count for all participants except sender
      conversation.participants.forEach((pId) => {
        const pIdStr = pId.toString();
        if (pIdStr !== req.user._id.toString()) {
          const currentUnread = conversation.unreadCounts.get(pIdStr) || 0;
          conversation.unreadCounts.set(pIdStr, currentUnread + 1);
        }
      });
    } else if (recipientId) {
      const currentUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
      conversation.unreadCounts.set(recipientId.toString(), currentUnread + 1);
    }

    await conversation.save();

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('[Send Message Error]', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// @desc    Mark messages as read in conversation
// @route   PUT /api/chat/read/:conversationId
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
      conversation.unreadCounts.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

// @desc    Edit a sent message
// @route   PUT /api/chat/messages/:id
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted message' });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar avatarName role')
      .populate('recipient', 'username avatar avatarName role');

    res.json(populatedMessage);
  } catch (error) {
    console.error('[Edit Message Error]', error);
    res.status(500).json({ message: 'Error editing message' });
  }
};

// @desc    Delete a sent message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    if (req.query.undo === 'true') {
      await Message.findByIdAndDelete(id);
      return res.json({ _id: id, conversationId: message.conversationId, isUndone: true });
    }

    message.isDeleted = true;
    message.text = 'This msg is deleted';
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar avatarName role')
      .populate('recipient', 'username avatar avatarName role');

    res.json(populatedMessage);
  } catch (error) {
    console.error('[Delete Message Error]', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

// @desc    Broadcast message to ALL clan warbands (War Horn dispatch)
// @route   POST /api/chat/warhorn
const broadcastWarHorn = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Broadcast message text is required' });
    }

    const formattedText = text.trim().startsWith('🔊 WAR HORN:')
      ? text.trim()
      : `🔊 WAR HORN DISPATCH: ${text.trim()}`;

    // Get all clans
    const clans = await Clan.find({});
    if (!clans || clans.length === 0) {
      return res.status(404).json({ message: 'No active clan warbands found to broadcast' });
    }

    const createdMessages = [];

    for (const clan of clans) {
      // Find or create group conversation for this clan
      let conversation = await Conversation.findOne({ clan: clan._id, isGroup: true });
      const memberUserIds = clan.members.map((m) => m.user);

      if (!conversation) {
        conversation = await Conversation.create({
          isGroup: true,
          clan: clan._id,
          groupName: clan.name,
          groupAvatar: clan.shieldEmblem,
          participants: memberUserIds,
          unreadCounts: {},
        });
      }

      const message = await Message.create({
        conversationId: conversation._id,
        sender: req.user._id,
        text: formattedText,
        delivered: true,
        read: false,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username avatar avatarName role')
        .populate('recipient', 'username avatar avatarName role');

      // Update conversation lastMessage & unread counts
      conversation.lastMessage = message._id;
      if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
      memberUserIds.forEach((pId) => {
        if (pId) {
          const pIdStr = pId.toString();
          if (pIdStr !== req.user._id.toString()) {
            const currentUnread = conversation.unreadCounts.get(pIdStr) || 0;
            conversation.unreadCounts.set(pIdStr, currentUnread + 1);
          }
        }
      });

      await conversation.save();
      createdMessages.push(populatedMessage);
    }

    res.status(201).json({
      message: `War horn blast dispatched to ${createdMessages.length} clan fortresses!`,
      messages: createdMessages,
      clansCount: createdMessages.length,
    });
  } catch (error) {
    console.error('[War Horn Broadcast Error]', error);
    res.status(500).json({ message: 'Error sounding War Horn broadcast' });
  }
};

module.exports = {
  getConversations,
  createOrGetConversation,
  getOrCreateClanConversation,
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  broadcastWarHorn,
};
