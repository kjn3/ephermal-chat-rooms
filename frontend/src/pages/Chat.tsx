import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

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
  const socketRef = useRef<Socket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const socketUrl = useMemo(() => process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', []);

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

    socket.on('room-joined', () => {
      setError(null);
    });
    
    socket.on('join-error', (e: { message: string }) => {
      console.error('Join room error:', e);
      setError(e?.message || 'Failed to join room');
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
              <p className="text-sm text-gray-400">
                {connected ? '🟢 Connected' : error ? '🔴 Disconnected' : '🟡 Connecting...'} • {nickname && `as ${nickname}`} • {messages.length} messages
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
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isOwnMessage = m.userId === 'me' || m.nickname === nickname;
              return (
                <div key={m.id} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 mb-1">
                    {m.nickname} • {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-3 py-2 rounded-lg inline-block max-w-xs break-words ${
                    isOwnMessage 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-100'
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
    </div>
  );
}


