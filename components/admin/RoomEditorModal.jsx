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
      alert('Error saving room: ' + result.error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
          {room ? 'Edit Room Details' : 'Add New Room'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Room Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5" placeholder="Deluxe Ocean Suite" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Room Number</label>
              <input type="text" required value={formData.room_number} onChange={(e) => setFormData({ ...formData, room_number: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Category</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5">
                <option value="AC">AC Room</option>
                <option value="Non-AC">Non-AC Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Price Per Night (₹)</label>
              <input type="number" required value={formData.price_per_night} onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5" />
            </div>
          </div>

          {/* Picture Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            {/* Room Images */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-2">Main Room Pictures</label>
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'room_images')} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.room_images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Room" className="h-16 w-16 object-cover rounded shadow-sm" />
                    <button type="button" onClick={() => removeImage(url, 'room_images')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bathroom Images */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-2">Bathroom Pictures</label>
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'bathroom_images')} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.bathroom_images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Bathroom" className="h-16 w-16 object-cover rounded shadow-sm" />
                    <button type="button" onClick={() => removeImage(url, 'bathroom_images')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Amenities (comma separated)</label>
            <input type="text" value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5" placeholder="Wi-Fi, TV, Geyser, Balcony" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Availability Status</label>
            <select value={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5">
              <option value="true">Available for Booking</option>
              <option value="false">Occupied / Under Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading || uploading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {loading ? 'Saving...' : uploading ? 'Uploading images...' : 'Save Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}