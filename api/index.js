const app = require('../backend/app');
const { connectDB } = require('../backend/config/db');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};

