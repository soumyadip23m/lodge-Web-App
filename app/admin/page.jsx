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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Room Management</h1>
            <p className="text-gray-600">Update pictures, AC status, pricing, and availability.</p>
          </div>
          <button
            onClick={() => { setSelectedRoom(null); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow"
          >
            + Add New Room
          </button>
        </div>

        {loading ? (
          <p className="text-center py-12 text-gray-500">Loading rooms database...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                <img src={room.room_images?.[0] || 'https://placehold.co/600x400?text=No+Image'} alt={room.name} className="h-48 w-full object-cover" />
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-gray-900">{room.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        room.type === 'AC' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {room.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-1">Room #{room.room_number}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.amenities?.map((amenity, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-xl font-bold text-gray-900">₹{room.price_per_night}</span>
                      <span className="text-xs text-gray-500"> / night</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium"
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