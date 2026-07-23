'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(name, room_number, type)')
        .order('check_in', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    };
    fetchBookings();
  }, []);

  // Filter Bookings (Check-ins / Active Stays)
  const bookingsList = bookings.filter((b) => {
    const isNotCheckedOut = b.status !== 'checked_out';
    if (!selectedDate) return isNotCheckedOut;
    return isNotCheckedOut && b.check_in === selectedDate;
  });

  // Filter Checkouts (Departed / Completed Stays)
  const checkoutsList = bookings.filter((b) => {
    const isCheckedOut = b.status === 'checked_out';
    if (!selectedDate) return isCheckedOut;
    return (
      (isCheckedOut || b.check_out === selectedDate) &&
      (b.check_out === selectedDate || b.actual_checkout_time?.startsWith(selectedDate))
    );
  });

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

        {/* Date Filter Search Bar */}
        <div className="bg-surface/90 dark:bg-surface/60 border border-border rounded-2xl p-4 sm:p-5 mb-10 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗓️</span>
            <div>
              <h3 className="text-base font-extrabold text-content">Filter by Date</h3>
              <p className="text-xs text-muted">Search exact check-ins and checkouts for a specific day</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-background text-content border border-border rounded-xl px-4 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer [color-scheme:light] dark:[color-scheme:dark] accent-primary w-full sm:w-auto"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold border border-red-500/20 transition-all cursor-pointer shrink-0"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-24 bg-surface/40 border border-border rounded-2xl max-w-xl mx-auto backdrop-blur-sm animate-pulse">
            <span className="text-4xl inline-block animate-bounce mb-3">⏳</span>
            <p className="text-lg font-bold text-content">Loading reservation logs...</p>
            <p className="text-xs text-muted mt-1">Syncing booking data from secure server</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* SECTION 1: BOOKINGS LIST (CHECK-INS / ACTIVE) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h2 className="text-xl font-extrabold text-content flex items-center gap-2">
                  <span>📥</span> Check-ins & Active Reservations
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                    {bookingsList.length}
                  </span>
                </h2>
                {selectedDate && <span className="text-xs text-muted font-bold">Showing check-ins for {selectedDate}</span>}
              </div>

              {bookingsList.length === 0 ? (
                <div className="bg-surface/50 border border-border rounded-2xl p-8 text-center text-muted text-sm italic">
                  No active reservations or check-ins found {selectedDate ? `for ${selectedDate}` : ''}.
                </div>
              ) : (
                <div className="bg-surface/90 dark:bg-surface/60 border border-border rounded-2xl overflow-hidden shadow-md backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-background/80 border-b border-border text-muted uppercase tracking-wider text-[11px] font-bold">
                          <th className="p-4">Room</th>
                          <th className="p-4">Primary Guest</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Members</th>
                          <th className="p-4">Check-in</th>
                          <th className="p-4">Check-out</th>
                          <th className="p-4">Paid</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {bookingsList.map((booking) => {
                          const membersCount = Array.isArray(booking.members) ? booking.members.length : 1;
                          return (
                            <tr key={booking.id} className="hover:bg-surface-hover/50 transition-colors">
                              <td className="p-4 font-extrabold text-primary whitespace-nowrap">
                                #{booking.rooms?.room_number || 'N/A'} <span className="text-[10px] font-normal text-muted">({booking.rooms?.type || 'Suite'})</span>
                              </td>
                              <td className="p-4 font-bold text-content whitespace-nowrap">{booking.customer_name}</td>
                              <td className="p-4 text-muted whitespace-nowrap">{booking.customer_phone}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded border border-primary/20">
                                  👥 {membersCount}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-emerald-500 whitespace-nowrap">🗓️ {booking.check_in}</td>
                              <td className="p-4 font-bold text-content whitespace-nowrap">🏁 {booking.check_out}</td>
                              <td className="p-4 font-extrabold text-content whitespace-nowrap">₹{booking.total_price}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <Link
                                  href={`/admin/bookings/${booking.id}`}
                                  className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow hover:shadow-primary/30 transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <span>👁️</span>
                                  <span>Details</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: CHECKOUTS LIST (DEPARTED / COMPLETED) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h2 className="text-xl font-extrabold text-content flex items-center gap-2">
                  <span>📤</span> Departed & Checkouts
                  <span className="text-xs font-bold bg-accent/10 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
                    {checkoutsList.length}
                  </span>
                </h2>
                {selectedDate && <span className="text-xs text-muted font-bold">Showing checkouts for {selectedDate}</span>}
              </div>

              {checkoutsList.length === 0 ? (
                <div className="bg-surface/50 border border-border rounded-2xl p-8 text-center text-muted text-sm italic">
                  No departed guests or checkouts found {selectedDate ? `for ${selectedDate}` : ''}.
                </div>
              ) : (
                <div className="bg-surface/90 dark:bg-surface/60 border border-border rounded-2xl overflow-hidden shadow-md backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-background/80 border-b border-border text-muted uppercase tracking-wider text-[11px] font-bold">
                          <th className="p-4">Room</th>
                          <th className="p-4">Primary Guest</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Members</th>
                          <th className="p-4">Check-in</th>
                          <th className="p-4">Actual Departure</th>
                          <th className="p-4">Paid</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {checkoutsList.map((booking) => {
                          const membersCount = Array.isArray(booking.members) ? booking.members.length : 1;
                          const departureTime = booking.actual_checkout_time 
                            ? new Date(booking.actual_checkout_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                            : `🏁 ${booking.check_out}`;

                          return (
                            <tr key={booking.id} className="hover:bg-surface-hover/50 transition-colors opacity-85 hover:opacity-100">
                              <td className="p-4 font-extrabold text-muted whitespace-nowrap">
                                #{booking.rooms?.room_number || 'N/A'} <span className="text-[10px] font-normal text-muted">({booking.rooms?.type || 'Suite'})</span>
                              </td>
                              <td className="p-4 font-bold text-content whitespace-nowrap">{booking.customer_name}</td>
                              <td className="p-4 text-muted whitespace-nowrap">{booking.customer_phone}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-background text-muted font-bold px-2 py-0.5 rounded border border-border">
                                  👥 {membersCount}
                                </span>
                              </td>
                              <td className="p-4 text-muted whitespace-nowrap">🗓️ {booking.check_in}</td>
                              <td className="p-4 font-bold text-accent whitespace-nowrap">⚡ {departureTime}</td>
                              <td className="p-4 font-extrabold text-content whitespace-nowrap">₹{booking.total_price}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  Checked Out
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <Link
                                  href={`/admin/bookings/${booking.id}`}
                                  className="px-4 py-2 bg-surface hover:bg-surface-hover text-content border border-border rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <span>👁️</span>
                                  <span>Details</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}