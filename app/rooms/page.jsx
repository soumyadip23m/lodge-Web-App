'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import RoomCard from '../../components/user/RoomCard';
import BookingModal from '../../components/user/BookingModal';

const PRESET_BRANCHES = [
  'ALL',
  'New Bay View (at New Digha)',
  'Bay View (at Old Digha)'
];

export default function CustomerRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]); // Stores active bookings for date overlap checks
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate today's local date in YYYY-MM-DD format
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Customer Requirement Filter States
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL', 'AC', or 'Non-AC'
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  const fetchRoomsAndBookings = async () => {
    setLoading(true);
    
    // --- 1. AUTOMATIC CHECKOUT SYSTEM ---
    // Find bookings where the checkout date has passed and they are still active
    const { data: expiredBookings } = await supabase
      .from('bookings')
      .select('id, room_id')
      .in('status', ['confirmed', 'pending'])
      .lt('check_out', today); // 'today' is already calculated at the top of your component

    if (expiredBookings && expiredBookings.length > 0) {
      const expiredBookingIds = expiredBookings.map(b => b.id);
      const expiredRoomIds = expiredBookings.map(b => b.room_id);

      // Update those bookings in the database to 'checked_out'
      await supabase
        .from('bookings')
        .update({ 
          status: 'checked_out', 
          actual_checkout_time: new Date().toISOString() 
        })
        .in('id', expiredBookingIds);

      // Release the rooms back to live inventory in the database
      await supabase
        .from('rooms')
        .update({ is_available: true })
        .in('id', expiredRoomIds);
    }
    // ------------------------------------

    // 2. Fetch all room inventory
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .order('price_per_night', { ascending: true });

    // 3. Fetch active reservations (confirmed or pending) to check date overlaps
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id, check_in, check_out, status')
      .in('status', ['confirmed', 'pending']);

    if (!roomsError) setRooms(roomsData || []);
    if (!bookingsError) setBookings(bookingsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoomsAndBookings();
  }, []);

  // Smart hotel availability checker: allows check-in on the exact same day someone checks out!
  const isRoomAvailableForDates = (roomId, start, end) => {
    if (!start || !end) return true; // If dates aren't selected yet, show all rooms
    
    return !bookings.some((b) => {
      if (b.room_id !== roomId) return false;
      // Safely slice to YYYY-MM-DD (first 10 chars) to prevent timestamp/timezone mismatch bugs!
      const existIn = (b.check_in || '').slice(0, 10);
      const existOut = (b.check_out || '').slice(0, 10);
      const reqIn = start.slice(0, 10);
      const reqOut = end.slice(0, 10);

      // Overlap formula: (existing_start < new_end) AND (existing_end > new_start)
      // If existOut === reqIn (e.g., "2026-05-15" > "2026-05-15"), this is FALSE! Same-day check-in allowed!
      return existIn < reqOut && existOut > reqIn;
    });
  };

  // Dynamically attach availability status to each room, then filter
  const processedRooms = rooms.map((room) => {
    const isDateSearchActive = Boolean(checkInDate && checkOutDate);
    
    // Check overlapping dates if dates are entered. 
    // If no dates are entered, default to true so users can still open the calendar for future dates.
    const isAvailableForSelectedDates = isDateSearchActive
      ? isRoomAvailableForDates(room.id, checkInDate, checkOutDate)
      : true;

    // Final availability considers admin's manual toggle AND date overlaps
    const isDynamicallyAvailable = room.is_available && isAvailableForSelectedDates;

    return { 
      ...room, 
      isDynamicallyAvailable, 
      isDateSearchActive 
    };
  });

  // Filter based on Customer Requirements & the "Show Available Only" toggle
  const filteredRooms = processedRooms.filter((room) => {
    const matchBranch = selectedBranch === 'ALL' || (room.branch || 'New Bay View (at New Digha)') === selectedBranch;
    const matchType = selectedType === 'ALL' || room.type === selectedType;
    const matchPrice = !maxPrice || room.price_per_night <= parseFloat(maxPrice);
    
    // If "Show Available Rooms Only" is checked, hide booked/unavailable rooms
    const matchAvailability = !onlyAvailable || room.isDynamicallyAvailable;

    return matchBranch && matchType && matchPrice && matchAvailability;
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

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mt-4 mb-4 bg-linear-to-r from-content via-primary to-accent bg-clip-text text-transparent">
            Available Guest House Rooms
          </h1>
          <p className="text-lg sm:text-xl text-muted leading-relaxed">
            Choose from our premium air-conditioned suites and comfortable standard rooms. Click any photo to open the full-screen interactive gallery.
          </p>

          </div>

        {/* INTERACTIVE CUSTOMER REQUIREMENT FILTER BAR */}
        <div className="mt-8 bg-surface/80 dark:bg-surface/50 border border-border rounded-2xl p-5 mb-10 shadow-lg backdrop-blur-md space-y-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/80 pb-3">
            <span className="text-sm font-extrabold text-content flex items-center gap-1.5">
              <span>🔍</span> Filter By Your Desired Requirements
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              🏨 Showing {filteredRooms.length} Available {filteredRooms.length === 1 ? 'Suite' : 'Suites'}
            </span>
          </div>

          {/* ROW 1: LOCATION, CATEGORY & BUDGET FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                📍 Select Branch Location
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-background text-content border border-border hover:border-primary/50 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer transition-all"
              >
                {PRESET_BRANCHES.map((branch) => (
                  <option key={branch} value={branch} className="bg-surface text-content">
                    {branch === 'ALL' ? '🌐 All Digha Locations' : `🏢 ${branch}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                ❄️ Room Category
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-background text-content border border-border hover:border-primary/50 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer transition-all"
              >
                <option value="ALL" className="bg-surface text-content">⚡ All Types (AC & Non-AC)</option>
                <option value="AC" className="bg-surface text-content">❄️ AC Room Only</option>
                <option value="Non-AC" className="bg-surface text-content">🍃 Non-AC Room Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                💰 Max Budget (/ Night)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g., 3000"
                className="w-full bg-background text-content border border-border hover:border-primary/50 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all placeholder:text-muted/60"
              />
            </div>
          </div>

          {/* ROW 2: LIVE DATE AVAILABILITY CHECKER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🗓️</span> Check-in Date
              </label>
              <input
                type="date"
                min={today}
                value={checkInDate}
                onChange={(e) => {
                  const newIn = e.target.value;
                  const newOut = checkOutDate && checkOutDate < newIn ? '' : checkOutDate;
                  setCheckInDate(newIn);
                  setCheckOutDate(newOut);
                }}
                className="w-full bg-background text-content border border-border hover:border-primary/50 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer transition-all scheme-light dark:scheme-dark accent-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🏁</span> Check-out Date
              </label>
              <input
                type="date"
                min={checkInDate || today}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-background text-content border border-border hover:border-primary/50 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer transition-all scheme-light dark:scheme-dark accent-primary"
              />
            </div>
          </div>

          {/* Quick Toggle & Reset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <label className="flex items-center space-x-2 text-xs font-bold text-content cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span>🟢 Show Available Rooms Only (Hide Booked)</span>
            </label>

            {(selectedBranch !== 'ALL' || selectedType !== 'ALL' || maxPrice !== '' || onlyAvailable || checkInDate || checkOutDate) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBranch('ALL');
                  setSelectedType('ALL');
                  setMaxPrice('');
                  setOnlyAvailable(false);
                  setCheckInDate('');
                  setCheckOutDate('');
                }}
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold border border-red-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <span>✕</span>
                <span>Reset All Filters</span>
              </button>
            )}
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
            <h3 className="text-xl font-bold text-content">No Rooms Match Your Requirements</h3>
            <p className="text-sm text-muted mt-2">
              We couldn&apos;t find any suites matching your branch location, budget, or category preferences right now.
            </p>
            <button
              onClick={() => {
                setSelectedBranch('ALL');
                setSelectedType('ALL');
                setMaxPrice('');
                setOnlyAvailable(false);
              }}
              className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer active:scale-95"
            >
              Reset Filters & View All Rooms
            </button>
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
            initialCheckIn={checkInDate}
            initialCheckOut={checkOutDate}
            onClose={() => setSelectedRoom(null)}
            onSuccess={fetchRoomsAndBookings}
          />
        )}
      </div>
    </div>
  );
}