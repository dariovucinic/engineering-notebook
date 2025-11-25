'use client';

/**
 * Copyright (c) 2025 Dario Vucinic - FlowSheet
 * All rights reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */


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
