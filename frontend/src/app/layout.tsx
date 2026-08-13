import type { Metadata } from 'next';
import { AuthProvider } from '@/store/auth-context';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mobile Job Hunter',
  description: 'A professional networking and job search platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
