import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !nickname) return;
    navigate(`/room/${roomId}?nickname=${encodeURIComponent(nickname)}&password=${encodeURIComponent(password)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Ephemeral Chat Rooms</h1>
          <p className="text-gray-600">Join a room to start a quick conversation.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Room ID</label>
            <input value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. a1b2c3d4" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nickname</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Kalle" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password (optional)</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Join Room</button>
        </form>
      </div>
    </div>
  );
}


