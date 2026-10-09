const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clan name is required'],
      unique: true,
      trim: true,
      maxlength: [24, 'Clan name cannot exceed 24 characters'],
    },
    description: {
      type: String,
      maxlength: [160, 'Description cannot exceed 160 characters'],
      default: 'Brave warriors defending the fortress in tactical skirmishes!',
    },
    tag: {
      type: String,
      unique: true,
      required: true,
    },
    bannerPattern: {
      type: String,
      default: 'crimson-fire',
    },
    shieldEmblem: {
      type: String,
      default: 'shield',
    },
    avatar: {
      type: String,
      default: 'bk',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    bannerTitle: {
      type: String,
      default: '',
    },
    bannerFilter: {
      type: String,
      default: 'none',
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['Leader', 'Co-Leader', 'Elder', 'Member'],
          default: 'Member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    trophies: {
      type: Number,
      default: 2450,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Clan', clanSchema);
