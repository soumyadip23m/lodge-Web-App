'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function BookingModal({ room, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    check_in: '',
    check_out: '',
  });
  const [loading, setLoading] = useState(false);

  // Calculate nights and total price
  const calculateTotal = () => {
    if (!formData.check_in || !formData.check_out) return room.price_per_night;
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays * room.price_per_night : room.price_per_night;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const totalPrice = calculateTotal();
    const payload = {
      room_id: room.id,
      ...formData,
      total_price: totalPrice,
      status: 'confirmed',
    };

    const { error } = await supabase.from('bookings').insert([payload]);
    
    // Update room availability status upon booking
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);

    setLoading(false);
    if (!error) {
      alert(`Booking confirmed for Room #${room.room_number}! Total: ₹${totalPrice}`);
      onSuccess();
      onClose();
    } else {
      alert('Booking failed: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Book {room.name}</h3>
            <p className="text-xs text-indigo-600 font-semibold">Room #{room.room_number} • {room.type}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500">Full Name</label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Email</label>
              <input
                type="email"
                required
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Check-in Date</label>
              <input
                type="date"
                required
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500">Check-out Date</label>
              <input
                type="date"
                required
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-200 mt-6">
            <span className="text-sm font-medium text-gray-600">Estimated Total:</span>
            <span className="text-xl font-bold text-indigo-600">₹{calculateTotal()}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow transition duration-200"
          >
            {loading ? 'Confirming Reservation...' : 'Confirm Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}