'use client';

import './panel.css';
import { PanelLayout } from './components/layout/PanelLayout';

export default function PanelPageLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout>{children}</PanelLayout>;
}
