'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import RoomEditorModal from '../../components/admin/RoomEditorModal';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rooms').select('*').order('room_number', { ascending: true });
    if (!error) setRooms(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await supabase.from('rooms').delete().eq('id', id);
      fetchRooms();
    }
  };

  return (
    <div className="min-h-screen bg-background text-content p-6 sm:p-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto animate-fade-in-up">
        
        {/* Executive Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border/80 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Staff Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-content via-primary to-accent bg-clip-text text-transparent">
              Admin Room Management
            </h1>
            <p className="text-muted text-sm sm:text-base mt-1">
              Update picture galleries, specifications, live pricing, and room availability.
            </p>
          </div>
          
          <button
            onClick={() => { setSelectedRoom(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 animate-pulse-glow"
          >
            <span>✨</span>
            <span>+ Add New Room</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted font-medium animate-pulse">
            Loading database inventory...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, idx) => (
              <div 
                key={room.id} 
                style={{ animationDelay: `${idx * 100}ms` }}
                className="bg-surface/90 dark:bg-surface/50 rounded-2xl shadow-md hover:shadow-2xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-border dark:border-slate-800/80 hover:border-primary/50 dark:hover:border-primary/40 overflow-hidden flex flex-col transition-all duration-500 group/card animate-fade-in-up backdrop-blur-sm"
              >
                <div className="relative h-52 w-full overflow-hidden bg-background">
                  <img 
                    src={room.room_images?.[0] || 'https://placehold.co/600x400?text=No+Image'} 
                    alt={room.name} 
                    className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500 opacity-95 group-hover/card:opacity-100" 
                  />
                  
                  {/* Status Pills */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border ${
                      room.type === 'AC' 
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30' 
                        : 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30'
                    }`}>
                      {room.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                      room.is_available 
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}>
                      {room.is_available ? 'Live' : 'Booked'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold text-xl text-content leading-snug">{room.name}</h3>
                      <span className="text-sm font-bold text-primary">#{room.room_number}</span>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {room.amenities?.map((amenity, idx) => (
                        <span key={idx} className="bg-background dark:bg-slate-800/80 text-muted border border-border/80 text-xs px-2.5 py-1 rounded-md font-medium">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/80 flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-extrabold text-content">₹{room.price_per_night}</span>
                      <span className="text-xs text-muted"> / night</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-surface-hover hover:bg-primary hover:text-white text-content rounded-xl text-xs font-bold border border-border/80 transition-all active:scale-95 shadow-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded-xl text-xs font-bold border border-red-500/20 transition-all active:scale-95 shadow-sm"
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

        {isModalOpen && (
          <RoomEditorModal
            room={selectedRoom}
            onClose={() => setIsModalOpen(false)}
            onSave={fetchRooms}
          />
        )}
      </div>
    </div>
  );
}