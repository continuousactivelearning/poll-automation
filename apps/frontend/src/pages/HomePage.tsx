// apps/frontend/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, Users, BarChart3, Mic, LayoutDashboard } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800 text-white flex items-center justify-center relative overflow-hidden px-4 sm:px-6 py-12 sm:py-16">
      {/* Join Meeting Button */}
      <div className="absolute top-6 right-8 z-30 flex flex-col gap-3 sm:flex-row sm:gap-3">
        <Link
          to="/login?redirect=create-poll"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          Create Poll
        </Link>
        <Link
          to="/login?redirect=join-poll"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold px-5 py-2 rounded-xl shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          Join Poll
        </Link>
      </div>
      {/* Glowing Orbs Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/20 blur-3xl rounded-full animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-500/20 blur-3xl rounded-full animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full text-center z-10"
      >
        <div className="mb-8 sm:mb-12">
          <motion.div
  initial={{ rotate: -20, scale: 0 }}
  animate={{ rotate: 0, scale: 1 }}
  transition={{ delay: 0.15, duration: 0.5 }}
  whileHover={{
    scale: 1.15,
    rotate: [0, 10, -10, 0],
    boxShadow: "0 0 40px 10px rgba(139,92,246,0.5), 0 0 80px 20px rgba(232,121,249,0.3)",
    background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)"
  }}
  className="inline-block p-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-xl cursor-pointer transition-all duration-300"
>
  <Sparkles className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(232,121,249,0.7)] transition-all duration-300" />
</motion.div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold gradient-text mt-6 mb-4 leading-tight">
            Welcome to <span className="text-primary-400">Poll Automation</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            An AI-powered smart polling platform designed to transform virtual meetings, classes, and collaborations into engaging, interactive experiences.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-left mt-12">
          {[
            {
              icon: <Rocket className="w-6 h-6" />,
              title: 'AI-Powered Polling',
              desc: 'Create intelligent, contextual polls using real-time AI suggestions.'
            },
            {
              icon: <Mic className="w-6 h-6" />,
              title: 'Voice to Poll',
              desc: 'Convert your speech to polls instantly using smart voice recognition.'
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: 'Role-Based Login',
              desc: 'Separate flows for Hosts and Students to manage or participate.'
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: 'Real-time Analytics',
              desc: 'Live results, engagement metrics, and data insights.'
            },
            {
              icon: <LayoutDashboard className="w-6 h-6" />,
              title: 'Gamified Dashboard',
              desc: 'Leaderboards, scores, and progress stats for users.'
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: 'Beautiful UI/UX',
              desc: 'Responsive, animated, and delightful user interface throughout.'
            }
          ].map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl hover:scale-[1.02] transition-transform hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:border-primary-400"
            >
              <div className="mb-3 text-primary-400">{icon}</div>
              <h3 className="text-xl font-semibold mb-1 text-white">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row sm:justify-center gap-4">
          <Link
            to="/login"
            className="inline-block bg-primary-500 hover:bg-primary-600 transition-all px-6 py-3 rounded-xl font-semibold shadow-md text-white text-center"
          >
            Host a Session
          </Link>
          <Link
            to="/login?redirect=join-poll"
            className="inline-block bg-green-500 hover:bg-green-600 transition-all px-6 py-3 rounded-xl font-semibold shadow-md text-white text-center"
          >
            Join a Poll
          </Link>
          <Link
            to="/register"
            className="inline-block border border-white/20 hover:bg-white/10 px-6 py-3 rounded-xl font-semibold text-white text-center"
          >
            Create Account
          </Link>
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            to="/contactUs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold shadow-lg bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 hover:from-blue-600 hover:via-blue-500 hover:to-blue-600 text-white transition-all duration-200 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            style={{
              minWidth: "160px",
              justifyContent: "center",
              boxShadow: "0 4px 24px 0 rgba(59,130,246,0.15)"
            }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5M21 10.5l-9 5.25L3 10.5M21 10.5v7a2 2 0 0 1-2 2h-4.5" />
            </svg>
            <span className="font-semibold">Contact Us</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;
