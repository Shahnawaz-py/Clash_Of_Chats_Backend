const Clan = require('../models/Clan');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

// Helper to generate a random 7-character clan tag like #8Y9QQ9P
const generateClanTag = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let tag = '#';
  for (let i = 0; i < 7; i++) {
    tag += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tag;
};

// @desc    Create a new clan
// @route   POST /api/clans
// @access  Private
const createClan = async (req, res) => {
  try {
    const { name, description, bannerPattern, shieldEmblem, memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Clan name is required' });
    }

    const existingClan = await Clan.findOne({ name: name.trim() });
    if (existingClan) {
      return res.status(400).json({ message: 'A clan with this name already exists in the realm' });
    }

    let tag = generateClanTag();
    let isTagUnique = false;
    while (!isTagUnique) {
      const existingTag = await Clan.findOne({ tag });
      if (!existingTag) {
        isTagUnique = true;
      } else {
        tag = generateClanTag();
      }
    }

    const mongoose = require('mongoose');

    // Build initial members array
    const membersList = [
      {
        user: req.user._id,
        role: 'Leader',
      },
    ];

    if (Array.isArray(memberIds)) {
      memberIds.forEach((id) => {
        if (id && String(id) !== String(req.user._id) && mongoose.Types.ObjectId.isValid(id)) {
          membersList.push({
            user: id,
            role: 'Member',
          });
        }
      });
    }

    const clan = await Clan.create({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      tag,
      bannerPattern: bannerPattern || 'crimson-fire',
      shieldEmblem: shieldEmblem || 'shield',
      leader: req.user._id,
      members: membersList,
      trophies: req.user.trophies || 2450,
      level: 1,
    });

    // Create group conversation for clan
    await Conversation.create({
      isGroup: true,
      clan: clan._id,
      groupName: clan.name,
      groupAvatar: clan.shieldEmblem,
      participants: membersList.map((m) => m.user),
      unreadCounts: {},
    });

    const populatedClan = await Clan.findById(clan._id)
      .populate('leader', 'username avatar level trophies role')
      .populate('members.user', 'username avatar level trophies role');

    res.status(201).json(populatedClan);
  } catch (error) {
    console.error('[Create Clan Error]', error);
    res.status(500).json({ message: error.message || 'Server error creating clan' });
  }
};

// @desc    Get all clans
// @route   GET /api/clans
// @access  Private
const getClans = async (req, res) => {
  try {
    const search = req.query.search;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { tag: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const clans = await Clan.find(query)
      .populate('leader', 'username avatar level trophies role')
      .populate('members.user', 'username avatar level trophies role')
      .sort({ createdAt: -1 });

    res.json(clans);
  } catch (error) {
    console.error('[Get Clans Error]', error);
    res.status(500).json({ message: 'Server error fetching clans' });
  }
};

// @desc    Get clan details by ID
// @route   GET /api/clans/:id
// @access  Private
const getClanById = async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id)
      .populate('leader', 'username avatar level trophies role')
      .populate('members.user', 'username avatar level trophies role');

    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    res.json(clan);
  } catch (error) {
    console.error('[Get Clan By ID Error]', error);
    res.status(500).json({ message: 'Server error fetching clan details' });
  }
};

// @desc    Join a clan
// @route   POST /api/clans/:id/join
// @access  Private
const joinClan = async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    const isMember = clan.members.some((m) => String(m.user) === String(req.user._id));
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this clan' });
    }

    clan.members.push({ user: req.user._id, role: 'Member' });
    await clan.save();

    // Sync group conversation participants
    let conversation = await Conversation.findOne({ clan: clan._id, isGroup: true });
    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: true,
        clan: clan._id,
        groupName: clan.name,
        groupAvatar: clan.shieldEmblem,
        participants: clan.members.map((m) => m.user),
        unreadCounts: {},
      });
    } else {
      if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
        conversation.participants.push(req.user._id);
        await conversation.save();
      }
    }

    const updatedClan = await Clan.findById(clan._id)
      .populate('leader', 'username avatar level trophies role')
      .populate('members.user', 'username avatar level trophies role');

    res.json(updatedClan);
  } catch (error) {
    console.error('[Join Clan Error]', error);
    res.status(500).json({ message: 'Server error joining clan' });
  }
};

// @desc    Leave a clan
// @route   POST /api/clans/:id/leave
// @access  Private
const leaveClan = async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    clan.members = clan.members.filter((m) => String(m.user) !== String(req.user._id));
    await clan.save();

    // Sync group conversation participants
    const conversation = await Conversation.findOne({ clan: clan._id, isGroup: true });
    if (conversation) {
      conversation.participants = conversation.participants.filter(
        (p) => String(p) !== String(req.user._id)
      );
      await conversation.save();
    }

    const updatedClan = await Clan.findById(clan._id)
      .populate('leader', 'username avatar level trophies role')
      .populate('members.user', 'username avatar level trophies role');

    res.json(updatedClan);
  } catch (error) {
    console.error('[Leave Clan Error]', error);
    res.status(500).json({ message: 'Server error leaving clan' });
  }
};

module.exports = {
  createClan,
  getClans,
  getClanById,
  joinClan,
  leaveClan,
};
