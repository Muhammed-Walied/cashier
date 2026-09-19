import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu } from 'lucide-react';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isPosScreen = location.pathname === '/';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f1a] text-[#f0f0ff] relative">
      {/* Ambient Glow Orbs */}
      <div className="ambient-orb ambient-orb-1 -top-32 -right-32 z-0" />
      <div className="ambient-orb ambient-orb-2 bottom-0 -left-24 z-0" />
      <div className="ambient-orb ambient-orb-3 top-1/2 left-1/3 z-0" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className={`flex-1 min-h-0 ${
            isPosScreen
              ? 'p-3 xl:p-4 overflow-hidden flex flex-col'
              : 'p-4 xl:p-5 overflow-y-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
