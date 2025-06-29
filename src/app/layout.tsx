import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AddToCartToastProvider } from '@/context/ToastContext';
import { AddToCartToast } from '@/components/common/AddToCartToast';

export const metadata: Metadata = {
  title: 'Local Sales Hub',
  description: 'Manage your local sales, inventory, and forecasts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AddToCartToastProvider>
          {children}
          <Toaster />
          <AddToCartToast />
        </AddToCartToastProvider>
      </body>
    </html>
  );
}
