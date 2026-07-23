'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          href="/rooms" 
          className="flex items-center space-x-2 font-extrabold text-xl tracking-tight text-primary hover:opacity-90 transition-opacity"
        >
          <span>🏨 Bay View</span>
          <span className="hidden sm:inline-block text-xs uppercase px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
            Guest Portal
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {!loading && user ? (
            <div className="flex items-center space-x-3">
              <span className="hidden md:inline-block text-sm font-medium text-muted bg-background px-3 py-1.5 rounded-full border border-border max-w-50 truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-1.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : !loading && !user ? (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-all"
            >
              Sign In
            </Link>
          ) : null}

          <div className="h-6 w-px bg-border hidden sm:block"></div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}