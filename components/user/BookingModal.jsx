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

  // Calculate nights and total price based on date difference
  const calculateTotal = () => {
    if (!formData.check_in || !formData.check_out) return room.price_per_night;
    const start = new Date(formData.check_in);
    const end = new Date(formData.check_out);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // If invalid date range or same day, default to 1 night minimum
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
    
    if (!error) {
      // Mark room as occupied in the catalog upon successful reservation
      await supabase.from('rooms').update({ is_available: false }).eq('id', room.id);
      setLoading(false);
      alert(`🎉 Reservation Confirmed for Room #${room.room_number}!\nTotal Amount: ₹${totalPrice}`);
      onSuccess();
      onClose();
    } else {
      setLoading(false);
      alert('Booking failed: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface/95 dark:bg-surface/90 text-content border border-border dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up transition-colors duration-300">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border/80">
          <div>
            <h3 className="text-xl font-extrabold text-content tracking-tight">Book {room.name}</h3>
            <p className="text-xs text-primary font-bold mt-0.5">Room #{room.room_number} • {room.type} Suite</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-muted hover:text-content text-lg font-bold w-8 h-8 rounded-full bg-background hover:bg-surface-hover flex items-center justify-center transition-all border border-border cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* BUTTON-STYLE DATE PICKER FIELDS */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🗓️</span> Check-in Date
              </label>
              <input
                type="date"
                required
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                className="w-full bg-surface-hover hover:bg-primary/15 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-content border border-border hover:border-primary/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark] accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🏁</span> Check-out Date
              </label>
              <input
                type="date"
                required
                min={formData.check_in || undefined} // Prevents selecting a check-out date before check-in
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                className="w-full bg-surface-hover hover:bg-primary/15 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-content border border-border hover:border-primary/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:light] dark:[color-scheme:dark] accent-primary"
              />
            </div>
          </div>

          {/* Price Calculation Summary */}
          <div className="bg-background/80 p-3.5 rounded-xl flex justify-between items-center border border-border mt-6">
            <span className="text-sm font-bold text-muted">Estimated Total:</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ₹{calculateTotal()}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-primary via-indigo-600 to-accent hover:from-primary-hover hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center space-x-2"
          >
            <span>{loading ? '⏳' : '⚡'}</span>
            <span>{loading ? 'Confirming Reservation...' : 'Confirm Reservation'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}