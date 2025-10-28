import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Room = { id: string; name: string; lastActivity?: string };

export default function Dashboard() {
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [invites, setInvites] = useState<Room[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setMyRooms([
      { id: 'welcome-123', name: 'Welcome Room', lastActivity: new Date().toISOString() },
    ]);
    setInvites([
      { id: 'team-abc', name: 'Team Standup', lastActivity: new Date().toISOString() },
    ]);
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="text-sm text-gray-400">Ephemeral Chat Rooms</div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">My Rooms</h2>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api/rooms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'New Room' })
                    });
                    const data = await res.json();
                    if (data?.success && data?.room?.id) {
                      navigate(`/room/${data.room.id}`);
                    }
                  } catch (e) {}
                }}
                className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
              >
                New Room
              </button>
            </div>
            <ul className="space-y-2">
              {myRooms.map((r) => (
                <li key={r.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-400">Last activity {new Date(r.lastActivity || '').toLocaleString()}</div>
                  </div>
                  <Link to={`/room/${r.id}`} className="text-sm underline">Open</Link>
                </li>
              ))}
              {myRooms.length === 0 && <div className="text-sm text-gray-400">No rooms yet.</div>}
            </ul>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Invites</h2>
            </div>
            <ul className="space-y-2">
              {invites.map((r) => (
                <li key={r.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-400">Last activity {new Date(r.lastActivity || '').toLocaleString()}</div>
                  </div>
                  <Link to={`/room/${r.id}`} className="text-sm underline">Join</Link>
                </li>
              ))}
              {invites.length === 0 && <div className="text-sm text-gray-400">No invites at the moment.</div>}
            </ul>
          </div>
        </section>

        <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <h2 className="font-medium mb-2">Info</h2>
          <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
            <li>Rooms auto-delete after inactivity.</li>
            <li>Invite others by sharing a room link.</li>
            <li>Use a password for private rooms.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}


