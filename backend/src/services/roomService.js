const { putItem, getItem, deleteItem, updateItem, queryItems } = require('../database/dynamodb');
const { v4: uuidv4 } = require('uuid');
const ROOMS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'rooms';
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE_NAME || 'messages';

async function createRoom(roomData) {
  try {
    const room = {
      ...roomData,
      id: roomData.id || uuidv4(),
      createdAt: roomData.createdAt || new Date().toISOString(),
      lastActivity: roomData.lastActivity || new Date().toISOString(),
      users: roomData.users || [],
      messages: roomData.messages || []
    };
    
    await putItem(ROOMS_TABLE, room);
    return room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

async function getRoom(roomId) {
  try {
    const result = await getItem(ROOMS_TABLE, { id: roomId });
    return result.Item;
  } catch (error) {
    console.error('Error getting room:', error);
    throw error;
  }
}

async function joinRoom(roomId, password, nickname) {
  try {
    const room = await getRoom(roomId);
    
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }
    
    if (room.password && room.password !== password) {
      return {
        success: false,
        message: 'Invalid password'
      };
    }
    
    if (room.users && room.users.length >= room.maxUsers) {
      return {
        success: false,
        message: 'Room is full'
      };
    }
    
    const userId = uuidv4();
    const user = {
      id: userId,
      nickname: nickname || `User${Math.floor(Math.random() * 1000)}`,
      joinedAt: new Date().toISOString()
    };
    
    const updatedUsers = [...(room.users || []), user];
    
    await updateItem(ROOMS_TABLE, { id: roomId }, {
      users: updatedUsers,
      lastActivity: new Date().toISOString()
    });
    
    return {
      success: true,
      room: {
        ...room,
        users: updatedUsers
      },
      user
    };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

async function leaveRoom(roomId, userId) {
  try {
    const room = await getRoom(roomId);
    
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }
    
    const updatedUsers = (room.users || []).filter(user => user.id !== userId);
    
    await updateItem(ROOMS_TABLE, { id: roomId }, {
      users: updatedUsers,
      lastActivity: new Date().toISOString()
    });
    
    return {
      success: true,
      room: {
        ...room,
        users: updatedUsers
      }
    };
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
}

async function deleteRoom(roomId, password) {
  try {
    const room = await getRoom(roomId);
    
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }
    
    if (room.password && room.password !== password) {
      return {
        success: false,
        message: 'Invalid password'
      };
    }
    
    await deleteItem(ROOMS_TABLE, { id: roomId });
    
    return {
      success: true,
      message: 'Room deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

async function addMessage(roomId, messageData) {
  try {
    const room = await getRoom(roomId);
    
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }
    
    const now = new Date().toISOString();
    const messageId = uuidv4();
    const sk = `${now}#${messageId}`;
    const message = {
      roomId,
      sk,
      id: messageId,
      ...messageData,
      timestamp: now
    };
    await putItem(MESSAGES_TABLE, message);
    await updateItem(ROOMS_TABLE, { id: roomId }, { lastActivity: now });
    return { success: true, message };
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

async function updateRoomActivity(roomId) {
  try {
    await updateItem(ROOMS_TABLE, { id: roomId }, {
      lastActivity: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating room activity:', error);
    throw error;
  }
}

async function getUserRooms(userEmail) {
  try {
    const { scanItems } = require('../database/dynamodb');
    const result = await scanItems(ROOMS_TABLE, 'ownerEmail = :email', {
      ':email': userEmail
    });
    
    return (result.Items || []).map(room => ({
      id: room.id,
      name: room.name,
      hasPassword: !!room.password,
      maxUsers: room.maxUsers,
      userCount: room.users ? room.users.length : 0,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      ownerEmail: room.ownerEmail,
      isOwner: true
    }));
  } catch (error) {
    console.error('Error getting user rooms:', error);
    throw error;
  }
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  addMessage,
  updateRoomActivity,
  getUserRooms
};
