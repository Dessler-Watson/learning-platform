'use client';

import dynamic from 'next/dynamic';

const WelcomePage = dynamic(
  () => import('@/ui/screens/welcome/WelcomePage').then((m) => m.WelcomePage),
  { ssr: false }
);

export default function Home() {
  return <WelcomePage />;
}
