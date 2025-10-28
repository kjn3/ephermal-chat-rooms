import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  const nickname = search.get('nickname') || '';
  const password = search.get('password') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const socketUrl = useMemo(() => process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', []);

  useEffect(() => {
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room-joined', () => setError(null));
    socket.on('join-error', (e: { message: string }) => setError(e?.message || 'Failed to join room'));
    socket.on('recent-messages', (recent: ChatMessage[]) => setMessages(recent));
    socket.on('new-message', (msg: ChatMessage) => setMessages((m) => [...m, msg]));

    socket.emit('join-room', { roomId, password, nickname });

    return () => {
      socket.emit('leave-room');
      socket.disconnect();
    };
  }, [roomId, password, nickname, socketUrl]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      userId: 'me',
      nickname: nickname || 'Me',
      message: input.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages((m) => [...m, optimistic]);
    socketRef.current?.emit('send-message', { message: input.trim() });
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-xl shadow flex flex-col h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Room: {roomId}</h2>
            <p className="text-sm text-gray-400">{connected ? 'Connected' : 'Disconnected'}</p>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <span className="text-xs text-gray-400">{m.nickname} • {new Date(m.timestamp).toLocaleTimeString()}</span>
              <span className="px-3 py-2 bg-gray-800 rounded-lg inline-block w-fit text-gray-100">{m.message}</span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900/60 rounded-b-xl">
          <input
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">Send</button>
        </form>
      </div>
    </div>
  );
}


