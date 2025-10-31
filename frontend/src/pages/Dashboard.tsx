import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomsApi, authApi } from '../utils/api';

type Room = { 
  id: string; 
  name: string; 
  lastActivity?: string; 
  isOwner?: boolean; 
  ownerEmail?: string;
  createdAt?: string;
  hasPassword?: boolean;
  userCount?: number;
  maxUsers?: number;
};

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
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRooms = async () => {
      if (!user) return;
      
      setIsLoadingRooms(true);
      try {
        const response = await roomsApi.getUserRooms();
        if (response.success && response.data?.rooms) {
          setMyRooms(response.data.rooms);
        } else {
          setError(response.message || 'Failed to fetch rooms');
        }
      } catch (err: any) {
        console.error('Error fetching user rooms:', err);
        setError(err.message || 'Failed to fetch rooms');
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchUserRooms();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (!user) return;
                setIsLoadingRooms(true);
                try {
                  const response = await roomsApi.getUserRooms();
                  if (response.success && response.data?.rooms) {
                    setMyRooms(response.data.rooms);
                    setError(null);
                  } else {
                    setError(response.message || 'Failed to fetch rooms');
                  }
                } catch (err: any) {
                  setError(err.message || 'Failed to fetch rooms');
                } finally {
                  setIsLoadingRooms(false);
                }
              }}
              disabled={isLoadingRooms}
              className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoadingRooms ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
            <div className="text-sm text-gray-400">Ephemeral Chat Rooms</div>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-900/20 border border-green-800 text-green-300' 
              : 'bg-red-900/20 border border-red-800 text-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">My Rooms</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="text-sm px-3 py-1 rounded bg-green-600 hover:bg-green-500"
                >
                  Join Room
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
                >
                  New Room
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {isLoadingRooms ? (
                <div className="text-sm text-gray-400 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Loading rooms...
                </div>
              ) : (
                <>
                  {myRooms.map((r) => (
                    <li key={r.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2 mb-1">
                            <span className="truncate">{r.name}</span>
                            {r.isOwner && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex-shrink-0">Owner</span>
                            )}
                            {r.hasPassword && (
                              <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded flex-shrink-0">🔒</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mb-1">
                            {r.isOwner ? 'You own this room' : `Owner: ${r.ownerEmail || 'Unknown'}`}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Last activity {new Date(r.lastActivity || r.createdAt || '').toLocaleString()}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{r.userCount || 0}/{r.maxUsers || 50} users</span>
                            <span>Created at{new Date(r.createdAt || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(r.id);
                                setToast({ message: 'Room ID copied to clipboard!', type: 'success' });
                                setTimeout(() => setToast(null), 3000);
                              } catch (err) {
                                setToast({ message: 'Failed to copy Room ID', type: 'error' });
                                setTimeout(() => setToast(null), 3000);
                              }
                            }}
                            className="text-sm px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                            title="Copy Room ID"
                          >
                            Copy Room ID
                          </button>
                          <Link 
                            to={`/room/${r.id}`} 
                            className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                          >
                            Open
                          </Link>
                          {r.isOwner && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                                  try {
                                    const response = await roomsApi.deleteRoom(r.id);
                                    if (response.success) {
                                      setMyRooms(prev => prev.filter(room => room.id !== r.id));
                                      setError(null);
                                      setToast({ message: 'Room deleted successfully!', type: 'success' });
                                      setTimeout(() => setToast(null), 3000);
                                    } else {
                                      setError(response.message || 'Failed to delete room');
                                    }
                                  } catch (err: any) {
                                    setError(err.message || 'Failed to delete room');
                                  }
                                }
                              }}
                              className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {myRooms.length === 0 && <div className="text-sm text-gray-400">No rooms yet.</div>}
                </>
              )}
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
                    lastActivity: response.data!.room.createdAt,
                    isOwner: response.data!.room.isOwner || true,
                    ownerEmail: response.data!.room.ownerEmail || user?.email || 'You',
                    createdAt: response.data!.room.createdAt
                  }]);
                  setToast({ message: 'Room created successfully!', type: 'success' });
                  setTimeout(() => setToast(null), 3000);
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

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Join Room</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinRoomId('');
                  setJoinRoomPassword('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-300 text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              setError(null);
              try {
                const response = await roomsApi.joinRoom(
                  joinRoomId.trim(),
                  joinRoomPassword || undefined
                );
                if (response.success && response.data?.room) {
                  setShowJoinModal(false);
                  setJoinRoomId('');
                  setJoinRoomPassword('');
                  setMyRooms((prev) => [...prev, { 
                    id: response.data!.room.id, 
                    name: response.data!.room.name, 
                    lastActivity: response.data!.room.lastActivity,
                    isOwner: response.data!.room.isOwner || false,
                    ownerEmail: response.data!.room.ownerEmail || 'Unknown',
                    createdAt: response.data!.room.createdAt
                  }]);
                  setToast({ message: 'Successfully joined room!', type: 'success' });
                  setTimeout(() => setToast(null), 3000);
                  navigate(`/room/${response.data!.room.id}`);
                } else {
                  setError(response.message || 'Failed to join room');
                }
              } catch (err: any) {
                setError(err.message || 'Failed to join room');
              } finally {
                setIsLoading(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-medium">Room ID</label>
                <input
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Enter room ID (e.g., abc123-def456)"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Get the Room ID from the room owner</p>
              </div>
              <div>
                <label className="block text-sm mb-2 font-medium">Password (optional)</label>
                <input
                  type="password"
                  value={joinRoomPassword}
                  onChange={(e) => setJoinRoomPassword(e.target.value)}
                  placeholder="Enter room password if required"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Only needed for private rooms</p>
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
                    setShowJoinModal(false);
                    setJoinRoomId('');
                    setJoinRoomPassword('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !joinRoomId.trim()}
                  className="flex-1 py-2 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    'Join Room'
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


