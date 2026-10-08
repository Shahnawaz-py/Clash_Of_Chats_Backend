const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coc_chat');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.log(`[Database Warning] Make sure MongoDB is running locally on mongodb://127.0.0.1:27017/coc_chat`);
  }
};

module.exports = connectDB;
