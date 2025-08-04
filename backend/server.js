// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB fails to connect
  });

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});