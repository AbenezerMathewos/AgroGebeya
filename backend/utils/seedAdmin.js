/**
 * One-off script to create an admin user.
 * Public registration deliberately cannot create admin accounts, so use this
 * to bootstrap your first admin.
 *
 * Usage:
 *   node utils/seedAdmin.js "Admin Name" admin@example.com "StrongPassword123"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node utils/seedAdmin.js "Admin Name" admin@example.com "StrongPassword123"');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
  });

  console.log(`Admin user created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Failed to seed admin:', error.message);
  process.exit(1);
});
