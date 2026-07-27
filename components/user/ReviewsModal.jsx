'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ReviewsModal({ room, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Review Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    customer_name: '',
    rating: 5,
    comment: ''
  });

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false });

    if (!error) setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [room.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.customer_name.trim() || !newReview.comment.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('reviews')
      .insert([{
        room_id: room.id,
        customer_name: newReview.customer_name,
        rating: newReview.rating,
        comment: newReview.comment
      }]);

    setIsSubmitting(false);

    if (!error) {
      setNewReview({ customer_name: '', rating: 5, comment: '' });
      fetchReviews(); // Refresh the list automatically
    } else {
      alert('Error submitting review: ' + error.message);
    }
  };

  // Helper to render stars
  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface/95 dark:bg-surface/90 text-content border border-border dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up transition-colors duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border/80 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-content tracking-tight flex items-center gap-2">
              <span>⭐</span> Guest Reviews
            </h3>
            <p className="text-xs text-primary font-bold mt-0.5">Room #{room.room_number} • {room.name}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-muted hover:text-content text-lg font-bold w-8 h-8 rounded-full bg-background hover:bg-surface-hover flex items-center justify-center transition-all border border-border cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 min-h-0">
          
          {/* Write a Review Section */}
          <div className="bg-background/50 border border-border p-4 rounded-xl">
            <h4 className="text-sm font-bold mb-3">Write a Review</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={newReview.customer_name}
                    onChange={(e) => setNewReview({...newReview, customer_name: e.target.value})}
                    className="w-full bg-background text-content border border-border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                    className="w-full bg-background text-content border border-border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent</option>
                    <option value={4}>⭐⭐⭐⭐☆ (4/5) Very Good</option>
                    <option value={3}>⭐⭐⭐☆☆ (3/5) Average</option>
                    <option value={2}>⭐⭐☆☆☆ (2/5) Poor</option>
                    <option value={1}>⭐☆☆☆☆ (1/5) Terrible</option>
                  </select>
                </div>
              </div>
              <textarea
                required
                placeholder="How was your stay? Tell us about your experience..."
                rows="3"
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                className="w-full bg-background text-content border border-border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
              ></textarea>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </form>
          </div>

          {/* Past Reviews List */}
          <div>
            <h4 className="text-sm font-bold mb-3 border-b border-border/80 pb-2">Past Customer Reviews</h4>
            {loading ? (
              <div className="text-center py-6 text-muted text-xs animate-pulse">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 bg-background/30 rounded-xl border border-dashed border-border text-muted text-xs italic">
                No reviews yet. Be the first to review this room!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-background p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-sm text-content block">{rev.customer_name}</span>
                        <span className="text-[10px] text-muted">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm tracking-widest">{renderStars(rev.rating)}</span>
                    </div>
                    <p className="text-xs text-content/90 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}