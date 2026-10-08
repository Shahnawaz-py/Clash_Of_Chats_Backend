const User = require('../models/User');

const onlineUsers = new Map(); // userId -> socketId

const initChatSocket = (io) => {
  io.on('connection', (socket) => {
    let currentUserId = null;

    // Handle user authentication & registration on socket
    socket.on('register_user', async (userId) => {
      if (!userId) return;
      currentUserId = userId.toString();
      onlineUsers.set(currentUserId, socket.id);
      socket.join(`user_${currentUserId}`);

      try {
        await User.findByIdAndUpdate(currentUserId, { isOnline: true, lastSeen: new Date() });
      } catch (err) {
        console.error('[Socket User Online Error]', err.message);
      }

      // Broadcast user online status
      io.emit('user_status_change', { userId: currentUserId, isOnline: true });
      io.emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    // Join specific conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Handle sending message via Socket.IO
    socket.on('send_message', (message) => {
      if (!message || !message.conversationId) return;

      // Broadcast to room members
      io.to(`conversation_${message.conversationId}`).emit('receive_message', message);

      // Notify recipient direct socket or emit notification for group chat
      if (message.recipient && message.recipient._id) {
        const recipientId = message.recipient._id.toString();
        io.to(`user_${recipientId}`).emit('new_message_notification', message);
      } else {
        io.emit('new_message_notification', message);
      }
    });

    // Handle typing status
    socket.on('typing', ({ conversationId, userId, username }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
      });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    // Handle message read confirmation
    socket.on('message_read', ({ conversationId, readByUserId }) => {
      io.to(`conversation_${conversationId}`).emit('messages_read_update', {
        conversationId,
        readByUserId,
      });
    });

    // Handle real-time message editing
    socket.on('edit_message', (message) => {
      if (!message || !message.conversationId) return;
      io.to(`conversation_${message.conversationId}`).emit('message_edited', message);
    });

    // Handle real-time message deletion
    socket.on('delete_message', (message) => {
      if (!message || !message.conversationId) return;
      io.to(`conversation_${message.conversationId}`).emit('message_deleted', message);
    });

    // Handle War Horn Broadcast to all clan channels
    socket.on('broadcast_warhorn', (data) => {
      if (!data) return;
      if (Array.isArray(data.messages)) {
        data.messages.forEach((msg) => {
          if (msg && msg.conversationId) {
            io.to(`conversation_${msg.conversationId}`).emit('receive_message', msg);
          }
        });
      }
      io.emit('new_warhorn_broadcast', data);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        try {
          await User.findByIdAndUpdate(currentUserId, { isOnline: false, lastSeen: new Date() });
        } catch (err) {
          console.error('[Socket Disconnect Error]', err.message);
        }

        io.emit('user_status_change', { userId: currentUserId, isOnline: false });
        io.emit('online_users_list', Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = initChatSocket;
