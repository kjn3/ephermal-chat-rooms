const { putItem, getItem, deleteItem, updateItem, queryItems } = require('../database/dynamodb');
const { v4: uuidv4 } = require('uuid');
const ROOMS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'rooms';
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE_NAME || 'messages';

const INACTIVITY_THRESHOLD = parseInt(process.env.INACTIVITY_THRESHOLD || '86400', 10);

function calculateTTL() {
  return Math.floor(Date.now() / 1000) + INACTIVITY_THRESHOLD;
}

async function createRoom(roomData) {
  try {
    const now = new Date().toISOString();
    const room = {
      ...roomData,
      id: roomData.id || uuidv4(),
      createdAt: roomData.createdAt || now,
      lastActivity: roomData.lastActivity || now,
      ttl: calculateTTL(),
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
    
    if (room.password && (!password || room.password !== password)) {
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
      lastActivity: new Date().toISOString(),
      ttl: calculateTTL()
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
      lastActivity: new Date().toISOString(),
      ttl: calculateTTL()
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
      timestamp: now,
      ttl: calculateTTL()
    };
    await putItem(MESSAGES_TABLE, message);
    await updateItem(ROOMS_TABLE, { id: roomId }, { lastActivity: now, ttl: calculateTTL() });
    return { success: true, message };
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

async function updateRoomActivity(roomId) {
  try {
    await updateItem(ROOMS_TABLE, { id: roomId }, {
      lastActivity: new Date().toISOString(),
      ttl: calculateTTL()
    });
  } catch (error) {
    console.error('Error updating room activity:', error);
    throw error;
  }
}

async function getUserRooms(userEmail) {
  try {
    const { queryItems } = require('../database/dynamodb');
    const result = await queryItems(
      ROOMS_TABLE,
      'ownerEmail = :email',
      {
        ':email': userEmail
      },
      {
        indexName: 'ownerEmail-index',
        scanIndexForward: false
      }
    );
    
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
    if (error.name === 'ValidationException' && error.message.includes('index')) {
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
    }
    console.error('Error getting user rooms:', error);
    throw error;
  }
}

async function extendRoomTTL(roomId) {
  try {
    const room = await getRoom(roomId);
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }
    const newTTL = calculateTTL() + 86400;
    await updateItem(ROOMS_TABLE, { id: roomId }, { ttl: newTTL, lastActivity: new Date().toISOString() });
    return { success: true, message: 'Room TTL extended successfully', room: {...room, ttl: newTTL} };
  } catch (error) {
    console.error('Error extending room TTL:', error);
    throw error;
  }
}

async function inviteUserToRoom(roomId, inviteeEmail, inviterEmail) {
  try {
    const room = await getRoom(roomId);
    if (!room) {
      return {
        success: false,
        message: 'Room not found'
      };
    }

    if (room.ownerEmail !== inviterEmail) {
      return {
        success: false,
        message: 'You are not the owner of this room'
      };
    }

    const INVITATIONS_TABLE = process.env.DYNAMODB_INVITATIONS_TABLE_NAME || 'invitations';
    const invitationId = uuidv4();
    const invitation = {
      id: invitationId,
      roomId,
      roomName: room.name,
      inviteeEmail,
      inviterEmail,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ttl: calculateTTL() + (7 * 24 * 60 * 60)
    };
  
    await putItem(INVITATIONS_TABLE, invitation);
    return { success: true, invitation };
  } catch (error) {
    console.error('Error inviting user to room:', error);
    throw error;
  }
}

async function getUserInvitations(userEmail) {
  try {
    const INVITATIONS_TABLE = process.env.DYNAMODB_INVITATIONS_TABLE_NAME || 'invitations';
    const { scanItems } = require('../database/dynamodb');
    const result = await scanItems(INVITATIONS_TABLE, 'inviteeEmail = :email', {
      ':email': userEmail
    });
    console.log('DEBUG invitations scan result: ', result);
    const pendingInvitations = (result.Items || []).filter(inv => inv.status === 'pending');
    
    const validInvitations = [];
    for (const inv of pendingInvitations) {
      try {
        const room = await getRoom(inv.roomId);
        if (room) {
          validInvitations.push({
            id: inv.id,
            roomId: inv.roomId,
            roomName: inv.roomName || room.name,
            inviterEmail: inv.inviterEmail,
            createdAt: inv.createdAt
          });
        } else {
          console.log(`Skipping invitation ${inv.id} - room ${inv.roomId} no longer exists`);
        }
      } catch (roomError) {
        console.error(`Error checking room ${inv.roomId} for invitation ${inv.id}:`, roomError);
      }
    }
    return validInvitations;
  } catch (error) {
    console.error('Error getting user invitations:', error);
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
  getUserRooms,
  extendRoomTTL,
  inviteUserToRoom,
  getUserInvitations
};
