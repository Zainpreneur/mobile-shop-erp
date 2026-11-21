import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MobileShop — Business Software', template: '%s · MobileShop' },
  description: 'Inventory, point of sale, repairs, customers and suppliers in one place.',
  applicationName: 'MobileShop Business Software',
};

export const viewport: Viewport = {
  themeColor: '#f6f8fb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
