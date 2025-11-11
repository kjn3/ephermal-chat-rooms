import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { roomsApi } from '../utils/api';

type ChatMessage = {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
};

export default function Chat() {
  const { roomId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const nickname = search.get('nickname') || '';
  const password = search.get('password') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentNickname, setCurrentNickname] = useState(nickname);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [roomTTL, setRoomTTL] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const socketUrl = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).APP_CONFIG?.APP_SOCKET_URL) {
      return (window as any).APP_CONFIG.APP_SOCKET_URL;
    }
    return (process.env as any).APP_SOCKET_URL || 'http://localhost:3001';
  }, []);

  useEffect(() => {
    const socket = io(socketUrl, { 
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });
    
    socket.on('disconnect', (reason) => {
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message.includes('timeout')) {
        setError('Connection timeout - server may be down');
      } else if (error.message.includes('CORS')) {
        setError('CORS error - check server configuration');
      } else {
        setError(`Connection failed: ${error.message}`);
      }
    });

    socket.on('room-joined', (data: { room?: any; user?: { id: string; nickname: string } }) => {
      setError(null);
      if (data.user) {
        setCurrentUserId(data.user.id);
        setCurrentNickname(data.user.nickname);
      }
      if (data.room?.ttl) {
        setRoomTTL(data.room.ttl);
      }
    });
    
    socket.on('join-error', (e: { message: string }) => {
      console.error('Join room error:', e);
      const errorMsg = e?.message || 'Failed to join room';
      setError(errorMsg);

      if (errorMsg.includes(password) && !password && roomId) {
        const roomPassword = prompt('This room requires a password. Please enter it:');
        if (roomPassword !== null) {
          navigate(`/room/${roomId}?password=${encodeURIComponent(roomPassword)}${nickname ? `&nickname=${encodeURIComponent(nickname)}` : ''}`, { replace: true });
          window.location.reload();
        }
      }
    });
    
    socket.on('recent-messages', (recent: ChatMessage[]) => {
      setMessages(recent);
    });
    
    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((m) => {
        const messageExists = m.some(existingMsg => existingMsg.id === msg.id);
        if (messageExists) {
          return m;
        }
        const newMessages = [...m, msg];
        return newMessages;
      });
      setIsSending(false);
    });

    socket.on('nickname-updated', (data: { userId: string; nickname: string }) => {
      setCurrentUserId((prevUserId) => {
        if (prevUserId === data.userId) {
          setCurrentNickname(data.nickname);
        }
        return prevUserId;
      });
      
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.userId === data.userId ? { ...msg, nickname: data.nickname } : msg
        )
      );
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    console.log('Emitting join-room with:', { roomId, password, nickname });
    socket.emit('join-room', { roomId, password, nickname });

    return () => {
      console.log('Cleaning up socket connection');
      socket.emit('leave-room');
      socket.disconnect();
    };
  }, [roomId, password, nickname, socketUrl]);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomInfo = async () => {
      try {
        const response = await roomsApi.getRoom(roomId);
        if (response.success && response.data?.room?.ttl) {
          setRoomTTL(response.data.room.ttl);
        }
      } catch (err) {
        console.error('Error fetching room info:', error);
      }
    };

    fetchRoomInfo();
  }, [roomId]);

  useEffect(() => {
    if (!roomTTL) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = roomTTL - now;
      if (remaining <= 0) {
        setRoomTTL(null);
      }
    };

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [roomTTL]);

  const formatTimeRemaining = (ttl: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = ttl - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0){
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleExtendRoom = async () => {
    if (!roomId || isExtending) return;

    setIsExtending(true);
    try {
      const response = await roomsApi.extendRoomTTL(roomId);
      if (response.success && response.data?.ttl) {
        setRoomTTL(response.data.ttl);
        setError(null);
      } else {
        setError(response.message || 'Failed to extend room');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extend room');
    } finally {
      setIsExtending(false);
    }
  };

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    
    const messageText = input.trim();
    
    setIsSending(true);
    socketRef.current?.emit('send-message', { message: messageText });
    setInput('');
    
    setTimeout(() => {
      setIsSending(false);
    }, 5000);
  };

  const handleNicknameChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim() || newNickname.trim().length < 1 || newNickname.trim().length > 20) {
      setError('Nickname must be between 1 and 20 characters');
      return;
    }
    
    const trimmedNickname = newNickname.trim();
    socketRef.current?.emit('update-nickname', { nickname: trimmedNickname });
    setShowNicknameModal(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-xl shadow flex flex-col h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div>
              <h2 className="text-lg font-semibold">Room: {roomId}</h2>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                {connected ? '🟢 Connected' : error ? '🔴 Disconnected' : '🟡 Connecting...'} • 
                <span className="flex items-center gap-1">
                  as <span className="font-medium">{currentNickname || nickname}</span>
                  <button
                    onClick={() => {
                      setNewNickname(currentNickname || nickname);
                      setShowNicknameModal(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs ml-1"
                    title="Change nickname"
                  >
                    <u>Change Nickname</u>
                  </button>
                </span>
                • {messages.length}
              </p>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-red-400">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded"
              >
                Retry
              </button>
            </div>
          )}
        </div>
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isOwnMessage = m.userId === currentUserId;
              return (
                <div key={m.id} className={`flex flex-col ${isOwnMessage ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[80%]`}>
                  <span className={`text-xs mb-1 ${isOwnMessage ? 'text-gray-300' : 'text-gray-400'}`}>
                    {m.nickname} • {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-4 py-2 rounded-2xl break-words ${
                    isOwnMessage 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}>
                    {m.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900/60 rounded-b-xl">
          <input
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            placeholder={connected ? "Type a message..." : "Connecting..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!connected}
          />
          <button 
            type="submit" 
            disabled={!connected || !input.trim() || isSending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSending ? 'Sending...' : connected ? 'Send' : 'Connecting...'}
          </button>
        </form>
      </div>

      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change Nickname</h3>
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-300 text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleNicknameChange} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-medium">New Nickname</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  maxLength={20}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{newNickname.length}/20 characters</p>
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNicknameModal(false);
                    setNewNickname('');
                    setError(null);
                  }}
                  className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newNickname.trim() || newNickname.trim().length < 1 || newNickname.trim().length > 20}
                  className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Update Nickname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


