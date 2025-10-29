import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const cacheToken = (token: string) => {
    localStorage.setItem('ecr_token', token);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = emailRef.current?.value?.trim() || '';
    const password = passRef.current?.value || '';
    if (!email || !password) return;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data?.success || !data?.token) {
        setError(data?.message || 'Authentication failed');
        return;
      }
      cacheToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-800 p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-gray-400 text-sm">Log in or create an account to manage your rooms.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input ref={emailRef} className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input ref={passRef} type="password" className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">
              {mode === 'login' ? 'Log in' : 'Register'}
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700">
              {mode === 'login' ? 'Register' : 'Use login'}
            </button>
          </div>
        </form>

        <div className="text-sm text-gray-400 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="underline hover:text-gray-200">Continue as visitor</button>
        </div>
      </div>
    </div>
  );
}


