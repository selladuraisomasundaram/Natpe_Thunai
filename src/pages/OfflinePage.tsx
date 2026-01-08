"use client";

import React from 'react';
import CosmicDashGame from '@/components/CosmicDashGame';

const OfflinePage = () => {
  return (
    // This wrapper ensures the offline page takes over the entire viewport immediately
    // preventing any "white space" or scrollbars
    <div className="w-full h-screen bg-[#050510] overflow-hidden fixed inset-0 z-50">
      <CosmicDashGame />
    </div>
  );
};

export default OfflinePage;