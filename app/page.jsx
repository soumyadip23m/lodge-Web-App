import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
            <div className="max-w-3xl">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider">
                    Welcome to
                </span>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mt-4 mb-6">
                    Bay View Guest House
                </h1>
                <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
                    Experience comfort and luxury by the bay. Browse our premium air-conditioned suites, check live availability, and book your stay in seconds.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                        href="/rooms"
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all duration-200"
                    >
                        Explore Available Rooms
                    </Link>
                    <Link
                        href="/login"
                        className="px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-bold text-lg backdrop-blur-sm transition-all duration-200"
                    >
                        Login / Admin Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}