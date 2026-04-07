require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manager_dashboard';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    const adminEmail = 'admin@example.com';
    const adminPassword = '123456';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await User.findOne({ role: 'manager' });

    if (existingAdmin) {
      console.log('Updating existing manager...');
      existingAdmin.email = adminEmail;
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log('Manager updated successfully');
    } else {
      console.log('Creating new manager...');
      await User.create({
        name: 'Administrator',
        email: adminEmail,
        passwordHash,
        role: 'manager'
      });
      console.log('Manager created successfully');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
