// backend/seedAdmin.js (updated)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bayview.com', role: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists, skipping insertion.');
      process.exit(0);
    }

    // Insert admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@bayview.com',
      password: 'password123',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user added successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding admin:', err);
    process.exit(1);
  });