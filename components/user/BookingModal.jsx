'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

// Strict validation regex rules for contact and ID formats
const VALIDATION_RULES = {
  phone: /^[6-9]\d{9}$/, // Exactly 10 digits starting with 6, 7, 8, or 9
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  aadhaar: /^\d{12}$/, // Exactly 12 numeric digits
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // Exactly 10 characters: 5 letters, 4 digits, 1 letter
  voter_id: /^[A-Z]{3}\d{7}$/, // Typical 10-character alphanumeric Voter ID
  passport: /^[A-Z]{1}[0-9]{7}$/ // Standard 8-character Indian Passport
};

// Helper to validate individual member ID numbers based on selected document type
const validateIdFormat = (idType, idNumber) => {
  const cleanId = idNumber.trim().toUpperCase();
  if (!cleanId) return { valid: false, msg: 'ID number cannot be empty.' };

  switch (idType) {
    case 'Aadhaar Card':
      return VALIDATION_RULES.aadhaar.test(cleanId)
        ? { valid: true }
        : { valid: false, msg: 'Aadhaar Card must be exactly 12 numeric digits.' };
    case 'PAN Card':
      return VALIDATION_RULES.pan.test(cleanId)
        ? { valid: true }
        : { valid: false, msg: 'PAN Card must be 10 characters (e.g., ABCDE1234F).' };
    case 'Voter ID':
      return cleanId.length >= 10 && cleanId.length <= 12
        ? { valid: true }
        : { valid: false, msg: 'Voter ID must be between 10 and 12 alphanumeric characters.' };
    case 'Driving License':
      return cleanId.length >= 15 && cleanId.length <= 16
        ? { valid: true }
        : { valid: false, msg: 'Driving License must be 15 or 16 alphanumeric characters.' };
    case 'Passport':
      return cleanId.length >= 8 && cleanId.length <= 9
        ? { valid: true }
        : { valid: false, msg: 'Passport number must be 8 or 9 alphanumeric characters.' };
    default:
      return cleanId.length >= 4 ? { valid: true } : { valid: false, msg: 'Invalid ID format.' };
  }
};

export default function BookingModal({ room, initialCheckIn = '', initialCheckOut = '', onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    check_in: initialCheckIn,
    check_out: initialCheckOut,
    members: [
      { name: '', age: '', id_type: 'Aadhaar Card', id_number: '', id_image_url: '' }
    ],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  // Calculate today's local date in YYYY-MM-DD format to block past date selections
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Handle Primary Phone Input with strict numeric 10-digit restriction
  const handlePhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    if (onlyDigits.length <= 10) {
      setFormData((prev) => ({ ...prev, customer_phone: onlyDigits }));
    }
  };

  // Handle Member inputs with bug-free immutability and auto-sync
  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.members];
    // Safely clone the specific member object to prevent React state mutation bugs
    const currentMember = { ...updatedMembers[index] };

    let sanitizedValue = value;

    if (field === 'id_type') {
      currentMember.id_type = value;
      currentMember.id_number = ''; // Safely reset ID number in the same transaction!
    } else if (field === 'age') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 3);
      currentMember.age = sanitizedValue;
    } else if (field === 'id_number') {
      const idType = currentMember.id_type;
      if (idType === 'Aadhaar Card') {
        sanitizedValue = value.replace(/\D/g, '').slice(0, 12);
      } else if (idType === 'PAN Card') {
        sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
      } else {
        sanitizedValue = value.replace(/[^a-zA-Z0-9-/]/g, '').toUpperCase().slice(0, 16);
      }
      currentMember.id_number = sanitizedValue;
    } else {
      currentMember[field] = sanitizedValue;
    }

    updatedMembers[index] = currentMember;

    // Automatically sync primary customer name with Member 1
    if (index === 0 && field === 'name') {
      setFormData((prev) => ({ ...prev, customer_name: sanitizedValue, members: updatedMembers }));
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

    // 1. Date Validation
    if (formData.check_in < today) {
      alert('⚠️ Check-in date cannot be in the past! Please select today or a future date.');
      return;
    }

    // 2. Primary Phone Number Validation (Must be exactly 10 digits starting with 6-9)
    if (!VALIDATION_RULES.phone.test(formData.customer_phone)) {
      alert('⚠️ Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    // 3. Email Validation (if provided)
    if (formData.customer_email && !VALIDATION_RULES.email.test(formData.customer_email)) {
      alert('⚠️ Please enter a valid email address.');
      return;
    }

    // 4. Strict Member Field & ID Format Validation
    for (let i = 0; i < formData.members.length; i++) {
      const m = formData.members[i];
      
      if (!m.name.trim()) {
        alert(`⚠️ Please enter the full legal name for Member #${i + 1}.`);
        return;
      }

      const ageNum = Number(m.age);
      if (!m.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        alert(`⚠️ Please enter a valid age (between 1 and 120) for Member #${i + 1} (${m.name || 'Unnamed'}).`);
        return;
      }

      if (!m.id_image_url) {
        alert(`⚠️ Please upload an ID card photo for Member #${i + 1} (${m.name}).`);
        return;
      }

      // Execute dynamic regex check against the selected ID document type
      const idCheck = validateIdFormat(m.id_type, m.id_number);
      if (!idCheck.valid) {
        alert(`⚠️ Member #${i + 1} (${m.name}): ${idCheck.msg}`);
        return;
      }
    }

    setLoading(true);

    // 5. Final Backend Overlap Check: Prevent double-booking for overlapping dates!
    // Fetch any active bookings for this room to verify availability right before saving
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('check_in, check_out, status')
      .eq('room_id', room.id)
      .in('status', ['confirmed', 'pending']);

    if (checkError) {
      setLoading(false);
      alert('⚠️ Unable to verify live room availability. Please try again.');
      return;
    }

    // Safely slice to YYYY-MM-DD (first 10 chars) to prevent timestamp/timezone mismatch bugs!
    const reqIn = formData.check_in.slice(0, 10);
    const reqOut = formData.check_out.slice(0, 10);

    // Overlap formula: (existing_start < new_end) AND (existing_end > new_start)
    // Notice: If existing check_out == new check_in, this evaluates to FALSE (No overlap), allowing consecutive-day bookings!
    const hasOverlap = existingBookings?.some((b) => {
      const existIn = (b.check_in || '').slice(0, 10);
      const existOut = (b.check_out || '').slice(0, 10);
      return existIn < reqOut && existOut > reqIn;
    });

    if (hasOverlap) {
      setLoading(false);
      alert('⚠️ Sorry! This room was just booked for those exact dates by someone else. Please select different dates or try another suite.');
      return;
    }

    const totalPrice = calculateTotal();
    const payload = {
      room_id: room.id,
      ...formData,
      total_price: totalPrice,
      status: 'confirmed',
    };

    const { error } = await supabase.from('bookings').insert([payload]);
    
    if (!error) {
      // NOTE: We do NOT set is_available = false permanently on the rooms table anymore!
      // This ensures other guests can still book this exact same room for future or consecutive dates.
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
                updated[0] = { ...updated[0], name: val }; // Bug-free object cloning
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
                maxLength="10"
                value={formData.customer_phone}
                onChange={handlePhoneChange}
                className="w-full bg-background text-content border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium shadow-sm tracking-wide"
                placeholder="10-digit mobile number"
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
                      <option value="Aadhaar Card" className="bg-surface text-content">Aadhaar Card (12 Digits)</option>
                      <option value="PAN Card" className="bg-surface text-content">PAN Card (10 Chars)</option>
                      <option value="Voter ID" className="bg-surface text-content">Voter ID</option>
                      <option value="Driving License" className="bg-surface text-content">Driving License</option>
                      <option value="Passport" className="bg-surface text-content">Passport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">ID Card Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      maxLength={
                        member.id_type === 'Aadhaar Card' ? 12 :
                        member.id_type === 'PAN Card' ? 10 : 16
                      }
                      value={member.id_number}
                      onChange={(e) => handleMemberChange(index, 'id_number', e.target.value)}
                      className="w-full bg-background text-content border border-border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold uppercase shadow-sm tracking-wider"
                      placeholder={
                        member.id_type === 'Aadhaar Card' ? '12-digit numeric number' :
                        member.id_type === 'PAN Card' ? 'e.g., ABCDE1234F' :
                        'Enter alphanumeric ID'
                      }
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

          {/* BUTTON-STYLE DATE PICKER FIELDS WITH PAST DATE RESTRICTION */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🗓️</span> Check-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={today} // Restricts date selection to start from present date only
                value={formData.check_in}
                onChange={(e) => {
                  const newCheckIn = e.target.value;
                  // If existing check-out is before new check-in, reset check-out
                  const newCheckOut = formData.check_out && formData.check_out < newCheckIn ? '' : formData.check_out;
                  setFormData({ ...formData, check_in: newCheckIn, check_out: newCheckOut });
                }}
                className="w-full bg-surface-hover hover:bg-primary/15 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-content border border-border hover:border-primary/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary scheme-light dark:scheme-dark accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
                <span>🏁</span> Check-out Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={formData.check_in || today} // Prevents selecting a check-out date before check-in or present date
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                className="w-full bg-surface-hover hover:bg-primary/15 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-content border border-border hover:border-primary/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary scheme-light dark:scheme-dark accent-primary"
              />
            </div>
          </div>

          {/* Price Calculation Summary */}
          <div className="bg-background/80 p-3.5 rounded-xl flex justify-between items-center border border-border mt-6">
            <span className="text-sm font-bold text-muted">Estimated Total:</span>
            <span className="text-2xl font-extrabold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              ₹{calculateTotal()}
            </span>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              uploadingIndex !== null ||
              !formData.check_in ||
              !formData.check_out ||
              formData.check_in < today ||
              formData.members.some((m) => !m.id_image_url || !m.name.trim() || !m.id_number.trim() || !String(m.age).trim() || Number(m.age) <= 0)
            }
            className="w-full mt-4 bg-linear-to-r from-primary via-indigo-600 to-accent hover:from-primary-hover hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center space-x-2"
          >
            <span>{loading ? '⏳' : uploadingIndex !== null ? '⬆️' : '⚡'}</span>
            <span>{loading ? 'Confirming Reservation...' : uploadingIndex !== null ? 'Uploading Member ID Photo...' : `Confirm Reservation (${formData.members.length} ${formData.members.length === 1 ? 'Guest' : 'Guests'})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}