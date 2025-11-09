// File: apps/frontend/src/components/FullPageLoader.tsx
import React from 'react';
import { Loader } from 'lucide-react';

const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900 bg-opacity-80 backdrop-blur-sm">
      <div className="flex flex-col items-center text-white">
        <Loader className="w-12 h-12 animate-spin text-primary-500" />
        <p className="mt-4 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default FullPageLoader;