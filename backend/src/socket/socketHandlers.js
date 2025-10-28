const { joinRoom, leaveRoom, addMessage, updateRoomActivity } = require('../services/roomService');
const { queryItems } = require('../database/dynamodb');
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE_NAME || 'messages';

const activeConnections = new Map();

function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', async (data) => {
      try {
        const { roomId, password, nickname } = data;
        
        const result = await joinRoom(roomId, password, nickname);
        
        if (result.success) {
          socket.join(roomId);
          activeConnections.set(socket.id, {
            roomId,
            userId: result.user.id,
            nickname: result.user.nickname
          });
          
          await updateRoomActivity(roomId);
          
          socket.emit('room-joined', {
            room: result.room,
            user: result.user
          });
          
          socket.to(roomId).emit('user-joined', {
            user: result.user,
            room: result.room
          });
          
          try {
            const res = await queryItems(
              MESSAGES_TABLE,
              'roomId = :r',
              { ':r': roomId }
            );
            const items = (res.Items || []).sort((a, b) => (a.sk > b.sk ? 1 : -1));
            socket.emit('recent-messages', items.slice(-50));
          } catch {}
        } else {
          socket.emit('join-error', {
            message: result.message
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('join-error', {
          message: 'Failed to join room'
        });
      }
    });
    
    socket.on('send-message', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        
        if (!connection) {
          socket.emit('error', {
            message: 'Not connected to any room'
          });
          return;
        }
        
        const { message, type = 'text' } = data;
        
        const messageData = {
          userId: connection.userId,
          nickname: connection.nickname,
          message,
          type
        };
        
        const result = await addMessage(connection.roomId, messageData);
        
        if (result.success) {
          await updateRoomActivity(connection.roomId);
          
          io.to(connection.roomId).emit('new-message', result.message);
        } else {
          socket.emit('error', {
            message: result.message
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', {
          message: 'Failed to send message'
        });
      }
    });
    
    socket.on('update-nickname', async (data) => {
      try {
        const connection = activeConnections.get(socket.id);
        
        if (!connection) {
          socket.emit('error', {
            message: 'Not connected to any room'
          });
          return;
        }
        
        const { nickname } = data;
        
        if (!nickname || nickname.length < 1 || nickname.length > 20) {
          socket.emit('error', {
            message: 'Nickname must be between 1 and 20 characters'
          });
          return;
        }
        
        connection.nickname = nickname;
        activeConnections.set(socket.id, connection);
        
        socket.to(connection.roomId).emit('nickname-updated', {
          userId: connection.userId,
          nickname: nickname
        });
        
        socket.emit('nickname-updated', {
          userId: connection.userId,
          nickname: nickname
        });
      } catch (error) {
        console.error('Error updating nickname:', error);
        socket.emit('error', {
          message: 'Failed to update nickname'
        });
      }
    });
    
    socket.on('leave-room', async () => {
      try {
        const connection = activeConnections.get(socket.id);
        
        if (connection) {
          const result = await leaveRoom(connection.roomId, connection.userId);
          
          if (result.success) {
            socket.to(connection.roomId).emit('user-left', {
              userId: connection.userId,
              room: result.room
            });
            
            socket.leave(connection.roomId);
            
            activeConnections.delete(socket.id);
            
            await updateRoomActivity(connection.roomId);
            
            socket.emit('room-left', {
              message: 'Successfully left room'
            });
          }
        }
      } catch (error) {
        console.error('Error leaving room:', error);
        socket.emit('error', {
          message: 'Failed to leave room'
        });
      }
    });
    
    socket.on('disconnect', async () => {
      try {
        const connection = activeConnections.get(socket.id);
        
        if (connection) {
          const result = await leaveRoom(connection.roomId, connection.userId);
          
          if (result.success) {
            socket.to(connection.roomId).emit('user-left', {
              userId: connection.userId,
              room: result.room
            });
            
            await updateRoomActivity(connection.roomId);
          }
          
          activeConnections.delete(socket.id);
        }
        
        console.log('User disconnected:', socket.id);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
}

module.exports = {
  initializeSocketHandlers
};
