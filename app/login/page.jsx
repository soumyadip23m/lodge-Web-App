'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (activeTab === 'customer') {
      // Customer simplified entry: sign in or sign up automatically
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
      }
      router.push('/rooms');
    } else {
      // Admin verification
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('Invalid Admin Credentials: ' + error.message);
        setLoading(false);
      } else {
        router.push('/admin');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Guest House Portal
        </h2>
        
        {/* Section Toggle */}
        <div className="mt-6 flex rounded-lg bg-gray-200 p-1">
          <button
            onClick={() => setActiveTab('customer')}
            className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'customer' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer Login
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'admin' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Admin Portal
          </button>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {activeTab === 'customer' ? 'Book & Explore Rooms' : 'Administrator Control Panel'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : activeTab === 'customer' ? 'Continue as Guest' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}