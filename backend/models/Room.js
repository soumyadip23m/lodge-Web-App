// backend/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomNumber: { type: String, required: true }, // Remove unique: true
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);