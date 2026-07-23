'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMsg('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If Customer login fails due to invalid credentials, redirect to Register Page
      if (activeTab === 'customer' && (
        signInError.message.toLowerCase().includes('invalid login credentials') ||
        signInError.status === 400
      )) {
        setInfoMsg('No active account found with these credentials. Redirecting to registration...');
        setTimeout(() => {
          router.push(`/signup?email=${encodeURIComponent(email)}`);
        }, 1800);
        return;
      }

      // For Admin or other errors, display the error message directly
      setError(activeTab === 'admin' ? `Admin Verification Failed: ${signInError.message}` : signInError.message);
      setLoading(false);
      return;
    }

    // Successful Login Routing
    setLoading(false);
    if (activeTab === 'customer') {
      router.push('/rooms');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background text-content flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Guest House Portal
        </h2>
        
        {/* Section Toggle */}
        <div className="mt-6 flex rounded-xl bg-surface p-1.5 border border-border shadow-sm">
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setError(''); setInfoMsg(''); }}
            className={`w-1/2 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'customer'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted hover:text-content hover:bg-surface-hover'
            }`}
          >
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); setInfoMsg(''); }}
            className={`w-1/2 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'admin'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted hover:text-content hover:bg-surface-hover'
            }`}
          >
            Admin Portal
          </button>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-border transition-colors">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-content">
              {activeTab === 'customer' ? 'Welcome Back, Guest' : 'Administrator Control Panel'}
            </h3>
            <p className="text-xs text-muted mt-1">
              {activeTab === 'customer' 
                ? 'Enter your credentials to book rooms and manage stays.' 
                : 'Restricted access for authorized staff only.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg text-red-600 dark:text-red-400 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg text-primary text-sm font-medium animate-fadeIn">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-content">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full px-3.5 py-2.5 bg-background border border-border rounded-lg shadow-sm text-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-content">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full px-3.5 py-2.5 bg-background border border-border rounded-lg shadow-sm text-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(infoMsg)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {loading ? 'Verifying...' : activeTab === 'customer' ? 'Sign In as Guest' : 'Access Admin Panel'}
            </button>
          </form>

          {activeTab === 'customer' && (
            <div className="mt-6 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted">
                Don&apos;t have an account yet?{' '}
                <Link href="/signup" className="font-bold text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}