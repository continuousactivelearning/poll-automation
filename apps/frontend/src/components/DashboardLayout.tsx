import React from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Sidebar for mobile (if you have a drawer/modal, render it separately) */}
      <Sidebar /> {/* If Sidebar handles its own mobile visibility, you can keep this. Otherwise, remove or adjust. */}
      <main className="flex-1 w-full md:ml-64 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;