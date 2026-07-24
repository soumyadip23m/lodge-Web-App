'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  const ALLOWED_ADMIN_EMAILS = [
    'admin@bayview.com',
    'owner@dighalodge.com' // Match this with your list in LoginPage
  ];

  useEffect(() => {
    const verifyAdminAndFetchBookings = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // If user is not logged in OR their email is not an authorized staff email
      if (!user || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
        alert('🔒 Unauthorized: Staff privileges required to view booking histories.');
        window.location.href = '/login';
        return;
      }

      // Authorized -> Fetch bookings along with room details
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rooms(name, room_number, type)')
        .order('check_in', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    };
    verifyAdminAndFetchBookings();
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

  // Export ONLY currently viewed/searched results with EXACT unaltered ID, Phone & individual Member data
  const exportFilteredToExcel = () => {
    const visibleRecords = [...bookingsList, ...checkoutsList];
    
    if (visibleRecords.length === 0) {
      alert('⚠️ No booking records available to export for this view/date!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Expanded headers to include every individual member's exact data
    csvContent += "Booking Ref ID,Room Number,Room Category,Check-in Date,Check-out Date,Actual Departure,Member Name,Age,Phone Number,Email Address,ID Document Type,Exact ID Number,Total Paid (INR),Status\r\n";

    visibleRecords.forEach((b) => {
      const id = `"${b.id || ''}"`;
      const roomNum = `"${b.rooms?.room_number || 'N/A'}"`;
      const roomType = `"${b.rooms?.type || 'Suite'}"`;
      const checkIn = `"${b.check_in || ''}"`;
      const checkOut = `"${b.check_out || ''}"`;
      const actualOut = `"${b.actual_checkout_time ? new Date(b.actual_checkout_time).toLocaleString() : '-'}"`;
      const paid = `"${b.total_price || 0}"`;
      const status = `"${b.status || ''}"`;
      const phone = b.customer_phone || '-';
      const email = b.customer_email || '-';

      const membersList = Array.isArray(b.members) && b.members.length > 0
        ? b.members
        : [{
            name: b.customer_name,
            age: b.age || 'N/A',
            id_type: b.id_type || 'Aadhaar Card',
            id_number: b.id_number || 'N/A'
          }];

      // Iterate through every person in the room so all member details get exported verbatim
      membersList.forEach((m, index) => {
        const memberName = `"${m.name || 'Unnamed'}"`;
        const memberAge = `"${m.age || 'N/A'}"`;
        // Prepending a tab (\t) inside quotes prevents Excel from changing long numeric strings (like Aadhaar or phone numbers) into scientific notation (E+11)
        const memberPhone = index === 0 ? `"\t${phone}"` : '"-"';
        const memberEmail = index === 0 ? `"${email}"` : '"-"';
        const idType = `"${m.id_type || 'Aadhaar Card'}"`;
        const exactIdNum = `"\t${m.id_number || 'N/A'}"`;

        csvContent += `${id},${roomNum},${roomType},${checkIn},${checkOut},${actualOut},${memberName},${memberAge},${memberPhone},${memberEmail},${idType},${exactIdNum},${paid},${status}\r\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateTag = selectedDate ? `_${selectedDate}` : '_All_Records';
    link.setAttribute("download", `Room_Bookings_Detailed_Report${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-background text-content border border-border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer [color-scheme:light] dark:[color-scheme:dark] accent-primary w-full sm:w-auto"
            />
            
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold border border-red-500/20 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={exportFilteredToExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 w-full sm:w-auto justify-center"
            >
              <span>📊</span>
              <span>Export {selectedDate ? 'Searched' : 'All'} to Excel</span>
            </button>
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