// src/app/(main)/layout.tsx
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Local Sales Hub',
    default: 'Local Sales Hub',
  },
};

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
