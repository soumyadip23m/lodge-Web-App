'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      // Fetch bookings along with room details
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(name, room_number, type)')
        .order('check_in', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    };
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-background text-content py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto animate-fade-in-up">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-10 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Staff Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-content via-primary to-accent bg-clip-text text-transparent">
              Room Booking History
            </h1>
            <p className="text-muted text-sm sm:text-base mt-1.5">
              View all past and upcoming guest house reservations and verify guest member ID data.
            </p>
          </div>
          
          <Link
            href="/admin"
            className="w-full sm:w-auto bg-surface hover:bg-surface-hover text-content border border-border px-5 py-3 rounded-xl font-bold shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <span>⬅️</span>
            <span>Back to Rooms</span>
          </Link>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-24 bg-surface/40 border border-border rounded-2xl max-w-xl mx-auto backdrop-blur-sm animate-pulse">
            <span className="text-4xl inline-block animate-bounce mb-3">⏳</span>
            <p className="text-lg font-bold text-content">Loading reservation logs...</p>
            <p className="text-xs text-muted mt-1">Syncing booking data from secure server</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-surface/60 border border-border rounded-2xl max-w-lg mx-auto p-8 backdrop-blur-md shadow-xl animate-fade-in-up">
            <span className="text-5xl inline-block mb-4">📋</span>
            <h3 className="text-xl font-bold text-content">No Booking Records Found</h3>
            <p className="text-sm text-muted mt-2">
              No guest house reservations have been recorded in the database yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {bookings.map((booking, idx) => {
              const membersCount = Array.isArray(booking.members) ? booking.members.length : 1;
              return (
                <div
                  key={booking.id}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  className="bg-surface/90 dark:bg-surface/60 rounded-2xl shadow-md hover:shadow-xl border border-border hover:border-primary/50 p-6 flex flex-col justify-between transition-all duration-300 animate-fade-in-up backdrop-blur-sm"
                >
                  <div>
                    {/* Top Status & Room Info */}
                    <div className="flex justify-between items-start gap-2 pb-4 border-b border-border/60">
                      <div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                          Room #{booking.rooms?.room_number || 'N/A'} • {booking.rooms?.type || 'Suite'}
                        </span>
                        <h3 className="text-lg font-extrabold text-content mt-2 truncate">
                          {booking.rooms?.name || 'Guest Room'}
                        </h3>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                        {booking.status}
                      </span>
                    </div>

                    {/* Guest Summary Details */}
                    <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted font-medium">Primary Guest:</span>
                        <span className="font-bold text-content truncate max-w-44">{booking.customer_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted font-medium">Phone Number:</span>
                        <span className="font-bold text-content">{booking.customer_phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted font-medium">Total Members:</span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          👥 {membersCount} {membersCount === 1 ? 'Person' : 'People'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted font-medium">Check-in:</span>
                        <span className="font-bold text-content">🗓️ {booking.check_in}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted font-medium">Check-out:</span>
                        <span className="font-bold text-content">🏁 {booking.check_out}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Footer & Action Button */}
                  <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-muted block">Total Paid</span>
                      <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        ₹{booking.total_price}
                      </span>
                    </div>

                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>👁️</span>
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}