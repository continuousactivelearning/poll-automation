"use client"

import type React from "react"
import { Users, Trophy, History, User, Award, Settings, Bell, Home, LogOut, Link } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"

interface StudentSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "", label: "Dashboard", icon: Home },
    { id: "join-poll", label: "Join Poll", icon: Link },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "history", label: "Poll History", icon: History },
    { id: "profile", label: "Profile", icon: User },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

 const handleItemClick = (itemId: string) => {
  navigate(itemId ? `/student/${itemId}` : "/student");
  if (window.innerWidth < 768) {
    onClose();
  }
};

  // Highlight active menu item based on current URL
  const isActive = (itemId: string) => {
    if (itemId === "") return location.pathname === "/student" || location.pathname === "/student/";
    return location.pathname === `/student/${itemId}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:z-auto
        bg-white/5 backdrop-blur-xl border-r border-white/10
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Student Portal</h2>
                <p className="text-sm text-gray-400">Learning Hub</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${
                      isActive(item.id)
                        ? "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-400 border border-primary-500/30"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive(item.id) ? "animate-pulse" : ""}`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {item.id === "notifications" && (
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentSidebar;
