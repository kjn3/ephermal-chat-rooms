import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../utils/api';

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const email = emailRef.current?.value?.trim() || '';
    const password = passRef.current?.value || '';
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = mode === 'login' 
        ? await authApi.login(email, password)
        : await authApi.register(email, password);

      if (response.success && (response.data?.token || response.token)) {
        const token = response.data?.token || response.token;
        if (token) {
          const user = {
            email: response.data?.user?.email || email,
            nickname: response.data?.user?.nickname || email.split('@')[0]
          };
          login(token, user);
          navigate('/dashboard');
        } else {
          setError('Invalid response from server');
        }
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
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
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? 'Logging in...' : 'Registering...'}
                </>
              ) : (
                mode === 'login' ? 'Log in' : 'Register'
              )}
            </button>
            <button 
              type="button" 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
              disabled={isLoading}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
            >
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


