'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';

export default function BookingDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingCheckout, setIsEditingCheckout] = useState(false);
    const [actualCheckout, setActualCheckout] = useState('');
    const [updating, setUpdating] = useState(false);

    const exportToExcel = () => {
        if (!booking) return;
        const roomNum = booking.rooms?.room_number || 'N/A';
        const checkIn = booking.check_in;
        const checkOut = booking.check_out;
        const phone = booking.customer_phone || 'N/A';
        const email = booking.customer_email || 'N/A';

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Room Number,Check-in Date,Check-out Date,Member Name,Age,Phone Number,Email Address,ID Type,ID Number\r\n";

        const membersList = Array.isArray(booking.members) && booking.members.length > 0
            ? booking.members
            : [{ name: booking.customer_name, age: booking.age || 'N/A', id_type: booking.id_type || 'Aadhaar Card', id_number: booking.id_number || 'N/A' }];

        membersList.forEach((m, index) => {
            const name = `"${m.name || 'Unnamed'}"`;
            const age = m.age || 'N/A';
            const mPhone = index === 0 ? `"${phone}"` : '"-"';
            const mEmail = index === 0 ? `"${email}"` : '"-"';
            const idType = `"${m.id_type || 'Aadhaar Card'}"`;
            const idNum = `"${m.id_number || 'N/A'}"`;
            csvContent += `${roomNum},${checkIn},${checkOut},${name},${age},${mPhone},${mEmail},${idType},${idNum}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Room_${roomNum}_Dossier_${booking.id.slice(0, 8)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        window.print();
    };

    const handleEarlyCheckout = async (e) => {
        e.preventDefault();
        setUpdating(true);

        const { error } = await supabase
            .from('bookings')
            .update({
                actual_checkout_time: actualCheckout,
                status: 'checked_out'
            })
            .eq('id', id);

        if (!error) {
            // Automatically release the room back to available inventory
            if (booking.room_id) {
                await supabase.from('rooms').update({ is_available: true }).eq('id', booking.room_id);
            }
            setBooking((prev) => ({ ...prev, actual_checkout_time: actualCheckout, status: 'checked_out' }));
            setIsEditingCheckout(false);
            alert('✅ Early checkout date & time recorded! Room marked as available.');
        } else {
            alert('Error updating checkout: ' + error.message);
        }
        setUpdating(false);
    };

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select('*, rooms(*)')
                .eq('id', id)
                .single();

            if (!error) setBooking(data);
            setLoading(false);
        };
        fetchBookingDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-content flex items-center justify-center p-6 transition-colors duration-500">
                <div className="text-center bg-surface/50 border border-border p-10 rounded-2xl max-w-md w-full backdrop-blur-md animate-pulse">
                    <span className="text-4xl inline-block animate-bounce mb-3">⏳</span>
                    <p className="text-lg font-bold text-content">Loading guest profile & ID records...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-background text-content flex items-center justify-center p-6 transition-colors duration-500">
                <div className="text-center bg-surface border border-border p-8 rounded-2xl max-w-md w-full shadow-xl">
                    <span className="text-5xl inline-block mb-4">⚠️</span>
                    <h3 className="text-xl font-bold text-content">Booking Record Not Found</h3>
                    <p className="text-sm text-muted mt-2">The requested reservation ID could not be retrieved.</p>
                    <button
                        onClick={() => router.push('/admin/bookings')}
                        className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                        ← Return to Booking History
                    </button>
                </div>
            </div>
        );
    }

    // Parse members array securely
    const membersList = Array.isArray(booking.members) && booking.members.length > 0
        ? booking.members
        : [{
            name: booking.customer_name,
            age: booking.age || 'N/A',
            id_type: booking.id_type || 'Aadhaar Card',
            id_number: booking.id_number || 'N/A',
            id_image_url: booking.id_image_url || ''
        }];

    return (
        <div className="min-h-screen bg-background text-content py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
            <div className="max-w-5xl mx-auto animate-fade-in-up">

                {/* Header & Back Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border/80">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-accent animate-ping"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-accent">Security & Verification</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-content">
                            Reservation Member Dossier
                        </h1>
                        <p className="text-xs sm:text-sm text-muted mt-1">
                            Booking Ref ID: <span className="font-mono text-primary">{booking.id}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap print:hidden">
                        <button
                            onClick={exportToExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                            <span>📊</span>
                            <span>Export Excel</span>
                        </button>

                        <button
                            onClick={exportToPDF}
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                            <span>🖨️</span>
                            <span>Save PDF / Print</span>
                        </button>

                        <Link
                            href="/admin/bookings"
                            className="bg-surface hover:bg-surface-hover text-content border border-border px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                        >
                            <span>⬅️</span>
                            <span>Back to History</span>
                        </Link>
                    </div>
                </div>

                {/* Room & Primary Contact Overview Panel */}
                <div className="bg-surface/90 dark:bg-surface/60 border border-border rounded-2xl p-6 mb-8 shadow-lg backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">Room Reserved</span>
                        <span className="text-lg font-extrabold text-primary block">
                            Room #{booking.rooms?.room_number || 'N/A'} • {booking.rooms?.type || 'Suite'}
                        </span>
                        <span className="text-xs text-content font-medium">{booking.rooms?.name || 'Guest Room'}</span>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">Stay Schedule & Status</span>
                        <span className="text-sm font-bold text-content block">🗓️ In: {booking.check_in}</span>
                        <span className="text-sm font-bold text-content block">🏁 Scheduled Out: {booking.check_out}</span>

                        {booking.actual_checkout_time ? (
                            <span className="text-xs font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 mt-1.5 inline-block">
                                ⚡ Left Early: {new Date(booking.actual_checkout_time).toLocaleString()}
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    // Pre-fill with current local date-time
                                    const now = new Date();
                                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                    setActualCheckout(now.toISOString().slice(0, 16));
                                    setIsEditingCheckout(true);
                                }}
                                className="mt-2 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold border border-primary/20 transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                            >
                                <span>⚡</span>
                                <span>Edit Early Checkout</span>
                            </button>
                        )}
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">Primary Contact details</span>
                        <span className="text-sm font-bold text-content block">📞 {booking.customer_phone}</span>
                        <span className="text-xs text-muted block truncate">{booking.customer_email || 'No email provided'}</span>
                        <span className="text-sm font-extrabold text-accent mt-1 block">Total Paid: ₹{booking.total_price}</span>
                    </div>
                </div>

                {/* Members ID Verification List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-extrabold text-content flex items-center gap-2">
                            <span>👥</span> Registered Guests ({membersList.length}) & ID Cards
                        </h2>
                        <span className="text-xs font-bold text-muted">All government IDs must be verified at check-in</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {membersList.map((member, idx) => (
                            <div
                                key={idx}
                                style={{ animationDelay: `${idx * 100}ms` }}
                                className="bg-surface/90 dark:bg-surface/50 rounded-2xl border border-border hover:border-primary/50 p-6 shadow-md transition-all duration-300 flex flex-col justify-between animate-fade-in-up backdrop-blur-sm"
                            >
                                <div>
                                    {/* Member Badge & Name */}
                                    <div className="flex justify-between items-center border-b border-border/60 pb-3 mb-4">
                                        <span className="flex items-center gap-2 font-extrabold text-base text-content">
                                            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </span>
                                            {member.name || 'Unnamed Guest'}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                            {idx === 0 ? 'Primary Guest' : 'Member'}
                                        </span>
                                    </div>

                                    {/* ID Document Details */}
                                    <div className="space-y-2 text-xs sm:text-sm mb-5">
                                        <div className="flex justify-between items-center bg-background/50 px-3 py-2 rounded-lg border border-border/50">
                                            <span className="text-muted font-medium">Age:</span>
                                            <span className="font-bold text-content">{member.age ? `${member.age} Years Old` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-background/50 px-3 py-2 rounded-lg border border-border/50">
                                            <span className="text-muted font-medium">Document Type:</span>
                                            <span className="font-bold text-primary">{member.id_type || 'Aadhaar Card'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-background/50 px-3 py-2 rounded-lg border border-border/50">
                                            <span className="text-muted font-medium">ID Number:</span>
                                            <span className="font-mono font-bold text-content tracking-wide">{member.id_number || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ID Card Image Preview Box */}
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2">
                                        Attached ID Card Photo
                                    </span>
                                    {member.id_image_url ? (
                                        <div className="relative group overflow-hidden rounded-xl border border-border bg-background aspect-video flex items-center justify-center">
                                            <img
                                                src={member.id_image_url}
                                                alt={`${member.name} ID`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <a
                                                    href={member.id_image_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-1.5"
                                                >
                                                    <span>🔍</span>
                                                    <span>Full Size Preview</span>
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center text-muted text-xs italic">
                                            ⚠️ No ID card photo uploaded for this member.
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* EARLY CHECKOUT EDIT MODAL */}
            {isEditingCheckout && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-surface/95 dark:bg-surface/90 text-content border border-border dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                        <div className="flex justify-between items-center pb-3 border-b border-border/80 mb-4">
                            <h3 className="text-lg font-extrabold text-content flex items-center gap-1.5">
                                <span>⚡</span> Record Early Departure
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsEditingCheckout(false)}
                                className="text-muted hover:text-content text-lg font-bold w-7 h-7 rounded-full bg-background hover:bg-surface-hover flex items-center justify-center transition-all border border-border cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEarlyCheckout} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                                    Select Actual Checkout Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={actualCheckout}
                                    onChange={(e) => setActualCheckout(e.target.value)}
                                    className="w-full bg-background text-content border border-border rounded-xl p-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer [color-scheme:light] dark:[color-scheme:dark] accent-primary"
                                />
                            </div>

                            <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-xs text-primary font-medium">
                                💡 Saving this will update the departure log and immediately switch Room #{booking.rooms?.room_number || ''} back to <strong>Live / Available</strong>.
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingCheckout(false)}
                                    className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-surface-hover transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="px-5 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {updating ? 'Saving...' : 'Confirm Checkout'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}