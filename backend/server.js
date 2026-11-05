const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env or root .env
const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const app = require('./app');
const { connectDB } = require('./config/db');
const Storage = require('./utils/storage');
const seedDatabase = require('./utils/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('\n======================================================');
  console.log('       SchoolConnect: Smart School Management         ');
  console.log("       MUET SZAB Campus, Khairpur Mir's Project       ");
  console.log('======================================================\n');

  // Connect to Database
  await connectDB();

  // Check if data exists; if completely empty, run automatic seeding
  try {
    const existingStudents = await Storage.students.find({});
    if (!existingStudents || existingStudents.length === 0) {
      console.log('No existing records found. Auto-seeding initial realistic data...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('Initial check notice:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n\x1b[32m✔ Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[36m✔ Open http://localhost:${PORT} in your web browser to view SchoolConnect\x1b[0m\n`);
  });
};

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

