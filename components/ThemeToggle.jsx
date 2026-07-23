'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="p-2.5 rounded-full bg-background border border-border text-content hover:bg-surface-hover transition-all shadow-sm flex items-center justify-center"
    >
      {isDark ? (
        <span className="text-sm font-bold flex items-center gap-1.5">☀️ <span className="hidden sm:inline">Light</span></span>
      ) : (
        <span className="text-sm font-bold flex items-center gap-1.5">🌙 <span className="hidden sm:inline">Dark</span></span>
      )}
    </button>
  );
}