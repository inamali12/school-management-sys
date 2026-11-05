const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolconnect';
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000 // Quick timeout if no server is running
    });
    isMongoConnected = true;
    console.log(`\x1b[32m✔ MongoDB Connected Successfully: ${conn.connection.host}\x1b[0m`);
    return true;
  } catch (error) {
    isMongoConnected = false;
    console.log(`\x1b[33m⚠ Note: Could not connect to MongoDB at "${uri}".\x1b[0m`);
    console.log(`\x1b[36mℹ SchoolConnect is activating Persistent Disk Storage Mode (JSON data store).\x1b[0m`);
    console.log(`\x1b[36mℹ All operations remain 100% persistent on disk. To use MongoDB Atlas, set MONGODB_URI in your .env file.\x1b[0m`);
    return false;
  }
};

const getMongoStatus = () => isMongoConnected;

module.exports = { connectDB, getMongoStatus };

