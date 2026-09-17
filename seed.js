require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

async function seed() {
  await connectDB();

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await Admin.hashPassword(password);

  const existing = await Admin.findOne({ username });

  if (existing) {
    // Sync the password to whatever is currently in .env instead of
    // silently keeping an old one — this is what "seed" should do when
    // you change ADMIN_PASSWORD and re-run this script.
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Admin "${username}" already existed — password updated to match .env.`);
  } else {
    await Admin.create({ username, passwordHash });
    console.log(`Admin account created -> username: ${username} / password: ${password}`);
  }

  console.log('You can log in now at /admin-login.html with the username/password above.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
