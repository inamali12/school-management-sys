const app = require('../backend/app');
const { connectDB } = require('../backend/config/db');

// Ensure database connection is initialized for Vercel Serverless Function
connectDB();

module.exports = app;

