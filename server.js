const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const clanRoutes = require('./routes/clanRoutes');
const friendRoutes = require('./routes/friendRoutes');
const initChatSocket = require('./sockets/chatSocket');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

initChatSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Clash of Chats Backend Server' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Clash of Chats] Backend server running on port ${PORT}`);
});
