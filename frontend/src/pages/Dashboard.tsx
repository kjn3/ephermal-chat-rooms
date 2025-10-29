import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsApi, authApi } from '../utils/api';

type Room = { id: string; name: string; lastActivity?: string };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [invites, setInvites] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Ephemeral Chat Rooms</div>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">My Rooms</h2>
              <button
                onClick={() => setShowCreateModal(true)}
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

        <section className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">User Info</h2>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
            >
              Change Password
            </button>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-400">Email:</span> {user?.email || 'N/A'}
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Nickname:</span> {user?.nickname || 'N/A'}
            </div>
            {showChangePassword && (
              <div className="mt-3 space-y-2">
                {error && <div className="text-sm text-red-400">{error}</div>}
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={async () => {
                    if (!currentPassword || !newPassword) {
                      setError('Please fill in both password fields');
                      return;
                    }
                    setIsLoading(true);
                    setError(null);
                    try {
                      const response = await authApi.changePassword(currentPassword, newPassword);
                      if (response.success) {
                        setShowChangePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setError(null);
                      } else {
                        setError(response.message || 'Failed to change password');
                      }
                    } catch (err: any) {
                      setError(err.message || 'Failed to change password');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              setError(null);
              try {
                console.log('Creating room with:', { 
                  roomName: roomName || 'New Room', 
                  roomPassword: roomPassword || undefined 
                });
                
                const response = await roomsApi.createRoom(
                  roomName || 'New Room',
                  roomPassword || undefined
                );
                
                console.log('Room creation response:', response);
                
                if (response.success && response.data?.room?.id) {
                  setShowCreateModal(false);
                  setRoomName('');
                  setRoomPassword('');
                  setMyRooms((prev) => [...prev, { 
                    id: response.data!.room.id, 
                    name: response.data!.room.name, 
                    lastActivity: response.data!.room.createdAt 
                  }]);
                  navigate(`/room/${response.data!.room.id}`);
                } else {
                  setError(response.message || 'Failed to create room');
                }
              } catch (err: any) {
                setError(err.message || 'Failed to create room');
              } finally {
                setIsLoading(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Room Name</label>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Password (optional)</label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter password for private room"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <div className="text-sm text-red-400">{error}</div>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoomName('');
                    setRoomPassword('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


