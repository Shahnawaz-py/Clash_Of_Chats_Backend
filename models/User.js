const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Warrior name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Warrior name must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Warband email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Passphrase is required'],
      minlength: [6, 'Passphrase must be at least 6 characters'],
    },
    avatar: {
      type: String,
      default: 'Chieftain',
    },
    avatarName: {
      type: String,
      default: 'Barbarian Chieftain (Fur & Leather Helm)',
    },
    trophies: {
      type: Number,
      default: 2450,
    },
    level: {
      type: Number,
      default: 72,
    },
    role: {
      type: String,
      default: 'Warrior',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isDemoUser: {
      type: Boolean,
      default: false,
    },
    bannerPattern: {
      type: String,
      default: 'arena',
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
    description: {
      type: String,
      default: 'Fearless Clash warrior ready for battle.',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
