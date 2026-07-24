'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import RoomEditorModal from '../../components/admin/RoomEditorModal';

const PRESET_BRANCHES = [
  'ALL',
  'New Bay View (at New Digha)',
  'Bay View (at Old Digha)'
];

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });
    if (!error) setRooms(data || []);
    setLoading(false);
  };

  const ALLOWED_ADMIN_EMAILS = ['admin@bayview.com', 'owner@dighalodge.com'];

  useEffect(() => {
    const verifyAdminAccess = async () => {
      setLoading(true);
      // Get the currently logged-in user session
      const { data: { user }, error } = await supabase.auth.getUser();

      // If not logged in OR email is not in the allowed admin list
      if (!user || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
        alert('🔒 Unauthorized: You must be logged in with a staff account to view the Admin Dashboard.');
        window.location.href = '/login'; // Force redirect to login page
        return;
      }

      // If authorized, load the room inventory
      fetchRooms();
    };

    verifyAdminAccess();
  }, []);

  // Filter rooms dynamically based on selected branch location
  const filteredRooms = rooms.filter((room) => {
    if (selectedBranch === 'ALL') return true;
    return (room.branch || 'New Bay View (at New Digha)') === selectedBranch;
  });

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this room? This cannot be undone!')) {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) {
        alert('Error deleting room: ' + error.message);
      } else {
        fetchRooms();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-content py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto animate-fade-in-up">

        {/* Executive Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-6 pb-6 border-b border-border/80 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Staff Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 bg-linear-to-r from-content via-primary to-accent bg-clip-text text-transparent">
              Admin Room Management
            </h1>
            <p className="text-muted text-sm sm:text-base mt-1.5">
              Select a branch location below to manage its inventory, pricing, and availability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/admin/bookings"
              className="w-full sm:w-auto bg-surface hover:bg-surface-hover text-content border border-border hover:border-primary/50 px-5 py-3.5 rounded-xl font-bold shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>📋</span>
              <span>Booking History</span>
            </Link>

            <button
              onClick={() => { setSelectedRoom(null); setIsModalOpen(true); }}
              className="w-full sm:w-auto bg-linear-to-r from-primary to-accent hover:from-primary-hover hover:to-cyan-400 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 animate-pulse-glow cursor-pointer"
            >
              <span>✨</span>
              <span>+ Add New Room</span>
            </button>
          </div>
        </div>

        {/* BRANCH LOCATION SELECTOR PILLS */}
        <div className="bg-surface/80 dark:bg-surface/50 border border-border rounded-2xl p-4 mb-10 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>📍</span> Active Branch Filter: <strong className="text-content">{selectedBranch === 'ALL' ? 'All Locations' : selectedBranch}</strong>
            </span>
            <span className="text-xs font-bold text-muted bg-background px-2.5 py-1 rounded-lg border border-border">
              🏨 Showing {filteredRooms.length} {filteredRooms.length === 1 ? 'Room' : 'Rooms'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_BRANCHES.map((branch) => {
              const isSelected = selectedBranch === branch;
              return (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer flex items-center gap-1.5 border ${isSelected
                      ? 'bg-linear-to-r from-primary via-indigo-600 to-accent text-white border-transparent shadow-lg shadow-primary/25 scale-102'
                      : 'bg-background hover:bg-surface-hover text-muted hover:text-content border-border'
                    }`}
                >
                  <span>{branch === 'ALL' ? '🌐' : '🏢'}</span>
                  <span>{branch === 'ALL' ? 'All Branches' : branch}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Content Area */}
        {loading ? (
          <div className="text-center py-24 bg-surface/40 border border-border rounded-2xl max-w-xl mx-auto backdrop-blur-sm animate-pulse">
            <span className="text-4xl inline-block animate-bounce mb-3">⏳</span>
            <p className="text-lg font-bold text-content">Loading database inventory...</p>
            <p className="text-xs text-muted mt-1">Syncing room details and availability</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20 bg-surface/60 border border-border rounded-2xl max-w-lg mx-auto p-8 backdrop-blur-md shadow-xl animate-fade-in-up">
            <span className="text-5xl inline-block mb-4">📍</span>
            <h3 className="text-xl font-bold text-content">No Rooms Found in this Branch</h3>
            <p className="text-sm text-muted mt-2">
              There are currently no suites assigned to <strong className="text-primary">{selectedBranch === 'ALL' ? 'any location' : selectedBranch}</strong>.
            </p>
            {selectedBranch !== 'ALL' && (
              <button
                onClick={() => setSelectedBranch('ALL')}
                className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
              >
                Show All Branches
              </button>
            )}
          </div>
        ) : (
          /* Stretched Grid Container for Equal Card Heights */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {filteredRooms.map((room, idx) => (
              <div
                key={room.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="bg-surface/90 dark:bg-surface/60 rounded-2xl shadow-md hover:shadow-2xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-border dark:border-slate-800/80 hover:border-primary/50 dark:hover:border-primary/40 overflow-hidden flex flex-col h-full transition-all duration-500 group/card animate-fade-in-up backdrop-blur-sm"
              >
                {/* Fixed Aspect Ratio Image Container */}
                <div className="relative h-52 w-full shrink-0 overflow-hidden bg-background">
                  <img
                    src={room.room_images?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                    alt={room.name}
                    className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500 opacity-95 group-hover/card:opacity-100"
                  />

                  {/* Floating Status Badges */}
                  <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border ${room.type === 'AC'
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
                        : 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30'
                      }`}>
                      {room.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${room.is_available
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}>
                      {room.is_available ? 'Live' : 'Booked'}
                    </span>
                  </div>

                  {/* Photo Count Indicator */}
                  {(room.room_images?.length > 1 || room.bathroom_images?.length > 0) && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      📷 {(room.room_images?.length || 0) + (room.bathroom_images?.length || 0)} Photos
                    </div>
                  )}
                </div>

                {/* Body Content Container */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold text-xl text-content leading-snug">{room.name}</h3>
                      <span className="text-sm font-bold text-primary shrink-0">#{room.room_number}</span>
                    </div>
                    <span className="inline-block text-[11px] font-bold text-muted bg-background px-2.5 py-0.5 rounded border border-border/80 mt-1">
                      📍 {room.branch || 'New Bay View (at New Digha)'}
                    </span>

                    {/* Wrapped Amenity Pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {room.amenities?.length > 0 ? (
                        room.amenities.map((amenity, idx) => (
                          <span key={idx} className="bg-background dark:bg-slate-800/80 text-muted border border-border/80 text-xs px-2.5 py-1 rounded-md font-medium">
                            {amenity}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted italic">No amenities specified</span>
                      )}
                    </div>
                  </div>

                  {/* Sticky Footer anchored to absolute bottom with mt-auto */}
                  <div className="mt-auto pt-5 border-t border-border/80 flex justify-between items-center gap-2">
                    <div>
                      <span className="text-2xl font-extrabold text-content">₹{room.price_per_night}</span>
                      <span className="text-xs text-muted"> / night</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-surface-hover hover:bg-primary hover:text-white text-content rounded-xl text-xs font-bold border border-border/80 transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded-xl text-xs font-bold border border-red-500/20 transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Room Editor Modal Trigger */}
        {isModalOpen && (
          <RoomEditorModal
            room={selectedRoom}
            currentBranch={selectedBranch !== 'ALL' ? selectedBranch : 'New Bay View (at New Digha)'}
            onClose={() => setIsModalOpen(false)}
            onSave={fetchRooms}
          />
        )}
      </div>
    </div>
  );
}