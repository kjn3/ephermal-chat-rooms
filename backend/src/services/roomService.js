const { putItem, getItem, deleteItem, updateItem } = require('../database/dynamodb');
const { v4: uuidv4 } = require('uuid');

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
    
    await putItem('rooms', room);
    return room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

async function getRoom(roomId) {
  try {
    const result = await getItem('rooms', { id: roomId });
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
    
    await updateItem('rooms', 
      { id: roomId },
      {
        users: updatedUsers,
        lastActivity: new Date().toISOString()
      }
    );
    
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
    
    await updateItem('rooms',
      { id: roomId },
      {
        users: updatedUsers,
        lastActivity: new Date().toISOString()
      }
    );
    
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
    
    await deleteItem('rooms', { id: roomId });
    
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
    
    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...(room.messages || []), message];
    
    await updateItem('rooms',
      { id: roomId },
      {
        messages: updatedMessages,
        lastActivity: new Date().toISOString()
      }
    );
    
    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

async function updateRoomActivity(roomId) {
  try {
    await updateItem('rooms',
      { id: roomId },
      {
        lastActivity: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error updating room activity:', error);
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
  updateRoomActivity
};
