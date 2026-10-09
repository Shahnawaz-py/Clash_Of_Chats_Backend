const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    delivered: {
      type: Boolean,
      default: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      text: { type: String },
      senderName: { type: String },
    },
    reactions: [
      {
        emoji: { type: String },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
