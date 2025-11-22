'use client';

import Canvas from '@/components/notebook/Canvas';
import { ComputationProvider } from '@/contexts/ComputationContext';

export default function Home() {
  return (
    <main className="min-h-screen">
      <ComputationProvider>
        <Canvas />
      </ComputationProvider>
    </main>
  );
}
