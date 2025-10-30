const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createRoom, getRoom, deleteRoom, joinRoom, getUserRooms } = require('../services/roomService');
const { validateRoomData } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.sub;
    const rooms = await getUserRooms(userEmail);
    
    res.json({
      success: true,
      data: {
        rooms
      }
    });
  } catch (error) {
    console.error('Error getting user rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user rooms'
    });
  }
});

router.post('/', authenticateToken, validateRoomData, async (req, res) => {
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
      users: [],
      ownerEmail: req.user.sub
    });
    
    res.status(201).json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          hasPassword: !!room.password,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt,
          ownerEmail: room.ownerEmail,
          isOwner: room.ownerEmail === req.user.sub
        }
      }
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
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
      data: {
        room: {
          id: room.id,
          name: room.name,
          hasPassword: !!room.password,
          maxUsers: room.maxUsers,
          userCount: room.users ? room.users.length : 0,
          createdAt: room.createdAt,
          lastActivity: room.lastActivity,
          ownerEmail: room.ownerEmail,
          isOwner: req.user ? room.ownerEmail === req.user.sub : false
        }
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

router.post('/:id/join', optionalAuth, async (req, res) => {
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
      data: {
        room: {
          ...result.room,
          ownerEmail: result.room.ownerEmail,
          isOwner: req.user ? result.room.ownerEmail === req.user.sub : false
        }
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const room = await getRoom(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    if (room.ownerEmail !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Only the room owner can delete this room'
      });
    }
    
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
