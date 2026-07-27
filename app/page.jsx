import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="relative min-h-screen bg-background text-content flex flex-col justify-center items-center p-6 text-center overflow-hidden transition-colors duration-500">
            {/* Ambient Background Glowing Blobs for Dark Mode Depth */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 dark:bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="relative z-10 max-w-4xl animate-fade-in-up">
                <div className="inline-block animate-float">
                    <span className="bg-primary/10 dark:bg-surface/80 text-primary dark:text-accent border border-primary/20 dark:border-accent/30 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest shadow-sm backdrop-blur-md">
                        ✨ Luxury Coastal Sanctuary
                    </span>
                </div>
                
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mt-6 mb-6 bg-linear-to-r from-content via-primary to-accent bg-clip-text text-transparent">
                    Bay View Guest House
                </h1>
                
                <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                    Experience unmatched comfort by the bay. Browse our premium air-conditioned suites, view interactive photo galleries, and reserve your stay in seconds.
                </p>

                <div className="flex justify-center">
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-linear-to-r from-primary to-primary-hover text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 animate-pulse-glow"
                    >
                        Login / Admin Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}