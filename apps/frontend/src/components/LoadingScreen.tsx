import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../contexts/LoadingContext';

const LoadingScreen = () => {
  const { isLoading } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
        >
          {/* Orbital Animation */}
          <div className="relative">
            {/* Central Hub */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: 360 
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 4, repeat: Infinity, ease: "linear" }
              }}
              className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg animate-glow"
            >
              <div className="w-8 h-8 bg-white rounded-full opacity-80" />
            </motion.div>

            {/* Orbital Rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className={`absolute inset-0 rounded-full border-2 border-dashed opacity-30 ${
                  i === 0 ? 'border-primary-400 w-32 h-32 -m-8' :
                  i === 1 ? 'border-secondary-400 w-48 h-48 -m-16' :
                  'border-accent-400 w-64 h-64 -m-24'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5
                  }}
                  className={`absolute w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-primary-400 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                    i === 1 ? 'bg-secondary-400 top-1/2 right-0 translate-x-1/2 -translate-y-1/2' :
                    'bg-accent-400 bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                  }`}
                />
              </motion.div>
            ))}

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                animate={{
                  y: [0, -20, 0],
                  x: [0, Math.sin(i) * 10, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
                style={{
                  left: `${50 + (i % 3 - 1) * 100}px`,
                  top: `${50 + (Math.floor(i / 3) - 1) * 100}px`,
                }}
              />
            ))}
          </div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-32 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Automatic Poll System
            </h2>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-400"
            >
              Initializing AI-powered polling...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;