import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;