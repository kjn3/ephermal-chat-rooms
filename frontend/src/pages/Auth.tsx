import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-800 p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-gray-400 text-sm">Log in or create an account to manage your rooms.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Log in</button>
        </form>

        <div className="text-sm text-gray-400 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="underline hover:text-gray-200">Continue as visitor</button>
          <Link to="#" className="underline hover:text-gray-200">Register</Link>
        </div>
      </div>
    </div>
  );
}


