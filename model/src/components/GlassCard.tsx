import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  hover = false 
}) => {
  return (
    <motion.div
      className={`glass-card ${hover ? 'hover-glow' : ''} ${className}`}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;