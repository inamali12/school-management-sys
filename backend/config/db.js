const mongoose = require('mongoose');

// Global cache for serverless environments (e.g., Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/schoolconnect';

  // Check for placeholder credentials in MongoDB Atlas URI
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    console.warn('\x1b[33m⚠ Warning: Your MONGODB_URI contains the placeholder "<db_password>". Please replace it with your actual MongoDB Atlas database user password in .env!\x1b[0m');
    console.log('\x1b[36mℹ Operating in local storage mode until valid Atlas credentials are provided in .env.\x1b[0m');
    isMongoConnected = false;
    return null;
  }

  // If connection is already cached and ready, return it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
      dbName: 'schoolconnect'
    };

    mongoose.set('strictQuery', false);

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      cached.conn = mongooseInstance;
      isMongoConnected = true;
      console.log(`\x1b[32m✔ MongoDB Connected Successfully: ${mongooseInstance.connection.host} (Database: ${mongooseInstance.connection.name})\x1b[0m`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      isMongoConnected = false;
      console.warn(`\x1b[33m⚠ MongoDB Connection Warning: ${err.message}\x1b[0m`);
      if (process.env.NODE_ENV === 'production') {
        console.error('\x1b[31m✘ Production Error: MongoDB Atlas must be connected in production mode!\x1b[0m');
      } else {
        console.log(`\x1b[36mℹ SchoolConnect persistent local fallback is active for development/testing.\x1b[0m`);
      }
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    isMongoConnected = false;
    return null;
  }
};

const getMongoStatus = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

module.exports = { connectDB, getMongoStatus };
