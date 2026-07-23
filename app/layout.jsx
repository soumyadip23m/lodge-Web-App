import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Bay View Guest House',
  description: 'Book your stay at Bay View Guest House',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-content antialiased min-h-screen selection:bg-primary selection:text-white transition-colors duration-300">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}