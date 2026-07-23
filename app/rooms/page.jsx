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
    const { data, error } = await supabase.from('rooms').select('*').order('price_per_night', { ascending: true });
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Available Guest House Rooms
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Choose from our premium air-conditioned suites and comfortable standard rooms.
          </p>

          {/* AC / Non-AC Filters */}
          <div className="mt-8 flex justify-center space-x-2">
            {['ALL', 'AC', 'Non-AC'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-full font-semibold text-sm shadow-sm transition-all ${
                  filter === type
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type === 'ALL' ? 'All Rooms' : `${type} Only`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-16 text-center text-gray-500">Loading catalog...</div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={(roomData) => setSelectedRoom(roomData)}
              />
            ))}
          </div>
        )}

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