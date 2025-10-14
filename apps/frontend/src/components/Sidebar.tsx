import { useRef, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Home,
  Mic,
  Brain,
  Users,
  Trophy,
  FileText,
  Settings,
  LogOut,
  PlusSquare,
  Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [location.pathname, open]);

  const menuItems = [
    { path: '/host', icon: Home, label: 'Dashboard' },
    { path: '/host/create-poll', icon: FileText, label: 'Create Poll Session' },
    { path: '/host/audio', icon: Mic, label: 'Audio Capture' },
    { path: '/host/ai-questions', icon: Brain, label: 'AI Questions' },
    { path: '/host/create-manual-poll', icon: PlusSquare, label: 'Create Manual Poll' },
    { path: '/host/participants', icon: Users, label: 'Participants' },
    { path: '/host/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/host/reports', icon: FileText, label: 'Reports' },
    { path: '/host/settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarContent = (
    <div className="p-6 flex flex-col h-full relative">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-3 mb-8 flex-shrink-0"
      >
        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-wide">Poll System</h1>
          <p className="text-gray-400 text-sm">AI-Powered</p>
        </div>
      </motion.div>

      {/* Top fade */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 z-10 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Scrollable menu */}
      <nav
        ref={navRef}
        className="space-y-2 flex-1 overflow-y-auto pr-2 hide-scrollbar relative z-0"
        tabIndex={0}
      >
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              ref={isActive ? activeItemRef : undefined}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <NavLink
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/30 to-secondary-500/10 text-primary-400 border border-primary-500/30 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setOpen(false)}
              >
                <span className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  <span className="font-medium tracking-wide">{item.label}</span>
                </span>
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="ml-auto w-2 h-2 bg-primary-400 rounded-full shadow"
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium tracking-wide mt-2"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );

  return (
    <>
      {/* Hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-black/50 p-2 rounded-lg"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
        type="button"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:bg-black/20 md:backdrop-blur-xl md:border-r md:border-white/10 md:z-40 md:block"
      >
        {sidebarContent}
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 md:hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white text-xl"
                onClick={() => {
                  console.log("Close clicked");
                  setOpen(false);
                }}
              >
                ✕
              </button>

              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
