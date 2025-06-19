import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'cyan' | 'magenta' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    cyan: 'text-electric-cyan border-electric-cyan/30',
    magenta: 'text-vibrant-magenta border-vibrant-magenta/30',
    yellow: 'text-vibrant-yellow border-vibrant-yellow/30',
  };

  return (
    <motion.div
      className={`glass-card p-6 ${colorClasses[color]} border-2`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        {trend && (
          <div className={`text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-300 text-sm">{title}</div>
    </motion.div>
  );
};

export default StatCard;