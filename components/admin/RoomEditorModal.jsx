'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function RoomEditorModal({ room, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: room?.name || '',
    room_number: room?.room_number || '',
    type: room?.type || 'AC',
    price_per_night: room?.price_per_night || '',
    amenities: room?.amenities?.join(', ') || '',
    is_available: room?.is_available ?? true,
    room_images: room?.room_images || [],
    bathroom_images: room?.bathroom_images || [],
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Universal image upload handler
  const handleImageUpload = async (e, category) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const uploadedUrls = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('room-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data } = supabase.storage.from('room-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      // Update state with new arrays
      setFormData((prev) => ({
        ...prev,
        [category]: [...prev[category], ...uploadedUrls],
      }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (urlToRemove, category) => {
    setFormData((prev) => ({
      ...prev,
      [category]: prev[category].filter((url) => url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      price_per_night: parseFloat(formData.price_per_night),
      amenities: formData.amenities.split(',').map((item) => item.trim()).filter(Boolean),
    };

    let result;
    if (room?.id) {
      result = await supabase.from('rooms').update(payload).eq('id', room.id);
    } else {
      result = await supabase.from('rooms').insert([payload]);
    }

    setLoading(false);
    
    if (!result.error) {
      onSave();
      onClose();
    } else {
      // Intercept the duplicate key error and show a friendly message
      if (result.error.message.includes('rooms_room_number_key') || result.error.code === '23505') {
        alert(`⚠️ Room #${formData.room_number} already exists in your system! Please choose a different room number.`);
      } else {
        alert('Error saving room: ' + result.error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface/95 dark:bg-surface/90 text-content border border-border dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl animate-fade-in-up transition-colors duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛠️</span>
            <h3 className="text-2xl font-extrabold text-content tracking-tight">
              {room ? 'Edit Room Specifications' : 'Add New Room'}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-muted hover:text-content text-xl font-bold w-8 h-8 rounded-full bg-background hover:bg-surface-hover flex items-center justify-center transition-all border border-border"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-content mb-1.5">Room Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium" 
                placeholder="e.g., Deluxe Ocean Suite" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-content mb-1.5">Room Number</label>
              <input 
                type="text" 
                required 
                value={formData.room_number} 
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })} 
                className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium" 
                placeholder="e.g., 101" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-content mb-1.5">Category</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium cursor-pointer"
              >
                <option value="AC" className="bg-surface text-content">❄️ AC Room</option>
                <option value="Non-AC" className="bg-surface text-content">🍃 Non-AC Room</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-content mb-1.5">Price Per Night (₹)</label>
              <input 
                type="number" 
                required 
                value={formData.price_per_night} 
                onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })} 
                className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium" 
                placeholder="e.g., 2500" 
              />
            </div>
          </div>

          {/* Picture Upload Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/80">
            {/* Room Images */}
            <div className="bg-background/60 p-4 rounded-xl border border-border">
              <label className="block text-sm font-bold text-content mb-2 flex items-center gap-1.5">
                <span>🛏️</span> Main Room Pictures
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'room_images')} 
                disabled={uploading} 
                className="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-all cursor-pointer" 
              />
              <div className="flex flex-wrap gap-2 mt-3.5">
                {formData.room_images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Room" className="h-16 w-16 object-cover rounded-lg border border-border shadow-sm" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(url, 'room_images')} 
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bathroom Images */}
            <div className="bg-background/60 p-4 rounded-xl border border-border">
              <label className="block text-sm font-bold text-content mb-2 flex items-center gap-1.5">
                <span>🚿</span> Bathroom Pictures
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'bathroom_images')} 
                disabled={uploading} 
                className="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-all cursor-pointer" 
              />
              <div className="flex flex-wrap gap-2 mt-3.5">
                {formData.bathroom_images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Bathroom" className="h-16 w-16 object-cover rounded-lg border border-border shadow-sm" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(url, 'bathroom_images')} 
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities Input */}
          <div>
            <label className="block text-sm font-bold text-content mb-1.5">Amenities (comma separated)</label>
            <input 
              type="text" 
              value={formData.amenities} 
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} 
              className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted/60 font-medium" 
              placeholder="Wi-Fi, Smart TV, Geyser, Sea View Balcony" 
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-bold text-content mb-1.5">Availability Status</label>
            <select 
              value={formData.is_available} 
              onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })} 
              className="w-full bg-background text-content border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium cursor-pointer"
            >
              <option value="true" className="bg-surface text-content">🟢 Available for Booking</option>
              <option value="false" className="bg-surface text-content">🔴 Occupied / Under Maintenance</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center space-x-3 pt-5 border-t border-border/80">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 border border-border rounded-xl text-content hover:bg-surface-hover font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || uploading} 
              className="px-6 py-3 bg-gradient-to-r from-primary via-indigo-600 to-accent hover:from-primary-hover hover:to-cyan-400 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-2"
            >
              <span>{loading ? '⏳' : uploading ? '⬆️' : '✨'}</span>
              <span>{loading ? 'Saving...' : uploading ? 'Uploading Images...' : 'Save Room Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}