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
    members: [
      { name: '', age: '', id_type: 'Aadhaar Card', id_number: '', id_image_url: '' }
    ],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index][field] = value;
    // Automatically sync primary customer name with Member 1
    if (index === 0 && field === 'name') {
      setFormData((prev) => ({ ...prev, customer_name: value, members: updatedMembers }));
    } else {
      setFormData((prev) => ({ ...prev, members: updatedMembers }));
    }
  };

  const addMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { name: '', age: '', id_type: 'Aadhaar Card', id_number: '', id_image_url: '' }],
    }));
  };

  const removeMember = (indexToRemove) => {
    if (formData.members.length === 1) return; // Keep at least 1 member
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleMemberIdUpload = async (e, index) => {
    try {
      setUploadingIndex(index);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `member-${index}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `guest-ids/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('id-cards').getPublicUrl(filePath);
      handleMemberChange(index, 'id_image_url', data.publicUrl);
    } catch (error) {
      alert('Error uploading ID card: ' + error.message);
    } finally {
      setUploadingIndex(null);
    }
  };

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
      <div className="bg-surface/95 dark:bg-surface/90 text-content border border-border dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up transition-colors duration-300 max-h-[90vh] overflow-y-auto">
        
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
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Primary Contact Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => {
                const val = e.target.value;
                const updated = [...formData.members];
                updated[0].name = val;
                setFormData({ ...formData, customer_name: val, members: updated });
              }}
              className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Email <span className="text-[10px] font-normal lowercase">(optional)</span></label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* DYNAMIC MULTI-MEMBER ID VERIFICATION SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <span>👥</span> Guest Members ({formData.members.length}) & ID Verification
              </span>
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[11px] font-bold border border-primary/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <span>+</span> Add Member
              </button>
            </div>

            {formData.members.map((member, index) => (
              <div key={index} className="bg-background/60 p-3.5 rounded-xl border border-border space-y-3 relative animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-content flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">{index + 1}</span>
                    {index === 0 ? 'Primary Guest' : `Additional Member #${index + 1}`}
                  </span>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-muted mb-1">Member Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      className="w-full bg-background text-content border border-border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
                      placeholder="Enter full legal name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Age <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={member.age}
                      onChange={(e) => handleMemberChange(index, 'age', e.target.value)}
                      className="w-full bg-background text-content border border-border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
                      placeholder="e.g., 25"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">ID Document Type <span className="text-red-500">*</span></label>
                    <select
                      value={member.id_type}
                      onChange={(e) => handleMemberChange(index, 'id_type', e.target.value)}
                      className="w-full bg-background text-content border border-border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer shadow-sm"
                    >
                      <option value="Aadhaar Card" className="bg-surface text-content">Aadhaar Card</option>
                      <option value="Voter ID" className="bg-surface text-content">Voter ID</option>
                      <option value="Driving License" className="bg-surface text-content">Driving License</option>
                      <option value="Passport" className="bg-surface text-content">Passport</option>
                      <option value="PAN Card" className="bg-surface text-content">PAN Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">ID Card Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={member.id_number}
                      onChange={(e) => handleMemberChange(index, 'id_number', e.target.value)}
                      className="w-full bg-background text-content border border-border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">Upload Photo of ID Card <span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    required={!member.id_image_url}
                    accept="image/*"
                    onChange={(e) => handleMemberIdUpload(e, index)}
                    disabled={uploadingIndex !== null}
                    className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-all cursor-pointer"
                  />
                  {uploadingIndex === index && <span className="text-[10px] text-accent font-bold mt-1 inline-block animate-pulse">⬆️ Uploading document to secure server...</span>}
                  {member.id_image_url && (
                    <div className="mt-2 flex items-center justify-between bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1">✓ ID Card Attached Successfully</span>
                      <a href={member.id_image_url} target="_blank" rel="noreferrer" className="text-[10px] text-accent underline font-bold">View</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            disabled={loading || uploadingIndex !== null || formData.members.some((m) => !m.id_image_url || !m.name || !m.id_number || !m.age)}
            className="w-full mt-4 bg-gradient-to-r from-primary via-indigo-600 to-accent hover:from-primary-hover hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center space-x-2"
          >
            <span>{loading ? '⏳' : uploadingIndex !== null ? '⬆️' : '⚡'}</span>
            <span>{loading ? 'Confirming Reservation...' : uploadingIndex !== null ? 'Uploading Member ID...' : `Confirm Reservation (${formData.members.length} ${formData.members.length === 1 ? 'Guest' : 'Guests'})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}