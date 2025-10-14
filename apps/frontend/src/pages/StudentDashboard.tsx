import { useState } from "react"
import { Menu, X } from "lucide-react"
import StudentSidebar from "../components/StudentSidebar"
import { Outlet } from "react-router-dom"

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="flex">
        {/* Sidebar */}
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 md:ml-0">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Student Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Content */}
          <div className="p-6"><Outlet /></div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard;
