const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createRoom, getRoom, deleteRoom, joinRoom } = require('../services/roomService');
const { validateRoomData } = require('../middleware/validation');

const router = express.Router();

router.post('/', validateRoomData, async (req, res) => {
  try {
    const { name, password, maxUsers = 50 } = req.body;
    const roomId = uuidv4();
    
    const room = await createRoom({
      id: roomId,
      name: name || `Room ${roomId.substring(0, 8)}`,
      password,
      maxUsers,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      users: []
    });
    
    res.status(201).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        maxUsers: room.maxUsers,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await getRoom(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        maxUsers: room.maxUsers,
        userCount: room.users ? room.users.length : 0,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room information'
    });
  }
});

router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, nickname } = req.body;
    
    const result = await joinRoom(id, password, nickname);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: 'Successfully joined room',
      room: result.room
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const result = await deleteRoom(id, password);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

module.exports = router;
