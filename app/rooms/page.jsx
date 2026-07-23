'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import RoomCard from '../../components/user/RoomCard';
import BookingModal from '../../components/user/BookingModal';

export default function CustomerRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'AC', 'Non-AC'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('price_per_night', { ascending: true });
    if (!error) setRooms(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'ALL') return true;
    return room.type === filter;
  });

  return (
    <div className="relative min-h-screen bg-background text-content py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 overflow-hidden">
      {/* Ambient Background Glowing Blobs for Dark Mode Depth */}
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-primary/15 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-accent/15 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
          <div className="inline-block animate-float">
            <span className="bg-primary/10 dark:bg-surface/80 text-primary dark:text-accent border border-primary/20 dark:border-accent/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md">
              ✨ Live Room Catalog
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mt-4 mb-4 bg-gradient-to-r from-content via-primary to-accent bg-clip-text text-transparent">
            Available Guest House Rooms
          </h1>
          <p className="text-lg sm:text-xl text-muted leading-relaxed">
            Choose from our premium air-conditioned suites and comfortable standard rooms. Click any photo to open the full-screen interactive gallery.
          </p>

          {/* AC / Non-AC Glassmorphic Filters */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { id: 'ALL', label: '🏨 All Rooms' },
              { id: 'AC', label: '❄️ AC Suites Only' },
              { id: 'Non-AC', label: '🍃 Standard Non-AC' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all duration-300 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-primary via-indigo-600 to-accent text-white shadow-lg shadow-primary/25 scale-105'
                    : 'bg-surface/80 hover:bg-surface text-content border border-border hover:border-primary/40 backdrop-blur-md hover:scale-102'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Content Area */}
        {loading ? (
          <div className="mt-20 text-center py-16 bg-surface/50 border border-border rounded-2xl max-w-xl mx-auto backdrop-blur-sm animate-pulse">
            <span className="text-3xl inline-block animate-bounce mb-3">⏳</span>
            <p className="text-lg font-bold text-content">Loading available suites...</p>
            <p className="text-xs text-muted mt-1">Syncing live database inventory</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Empty State Fallback */
          <div className="mt-16 text-center py-16 bg-surface/60 border border-border rounded-2xl max-w-lg mx-auto p-8 backdrop-blur-md shadow-xl animate-fade-in-up">
            <span className="text-5xl inline-block mb-4">🔍</span>
            <h3 className="text-xl font-bold text-content">No Rooms Found</h3>
            <p className="text-sm text-muted mt-2">
              We couldn&apos;t find any rooms matching the <strong className="text-primary">{filter}</strong> category right now.
            </p>
            {filter !== 'ALL' && (
              <button
                onClick={() => setFilter('ALL')}
                className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
              >
                Show All Rooms
              </button>
            )}
          </div>
        ) : (
          /* Room Cards Grid */
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room, idx) => (
              <div
                key={room.id}
                style={{ animationDelay: `${idx * 120}ms` }}
                className="animate-fade-in-up h-full"
              >
                <RoomCard
                  room={room}
                  onSelect={(roomData) => setSelectedRoom(roomData)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Reservation Modal Trigger */}
        {selectedRoom && (
          <BookingModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onSuccess={fetchRooms}
          />
        )}
      </div>
    </div>
  );
}