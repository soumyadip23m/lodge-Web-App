// backend/routes/rooms.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new room
router.post('/', async (req, res) => {
  const room = new Room({
    name: req.body.name,
    roomNumber: req.body.roomNumber,
    price: req.body.price,
    imageUrl: req.body.imageUrl,
    description: req.body.description
  });

  try {
    const newRoom = await room.save();
    res.status(201).json(newRoom);
  } catch (err) {
    console.error('Room save error:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: 'A room with this room number already exists. Please use a unique room number.' });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});

// Update a room
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.name = req.body.name || room.name;
    room.roomNumber = req.body.roomNumber || room.roomNumber;
    room.price = req.body.price || room.price;
    room.description = req.body.description || room.description;

    try {
      const updatedRoom = await room.save();
      res.json(updatedRoom);
    } catch (err) {
      console.error('Room update error:', err);
      if (err.code === 11000) {
        res.status(400).json({ message: 'A room with this room number already exists. Please use a unique room number.' });
      } else {
        res.status(400).json({ message: err.message });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a room
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;