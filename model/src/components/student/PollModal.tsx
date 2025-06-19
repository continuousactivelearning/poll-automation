import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Poll {
  id: string;
  question: string;
  options: string[];
  duration: number;
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: Poll;
}

const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, poll }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(poll.duration);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(poll.duration);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowResults(false);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitted) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, poll.duration]);

  const handleAutoSubmit = () => {
    if (selectedOption !== null) {
      submitAnswer();
    } else {
      toast.error('Time\'s up! No answer submitted.');
      onClose();
    }
  };

  const submitAnswer = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer');
      return;
    }

    setIsSubmitted(true);
    toast.success('Answer submitted!');
    
    // Simulate showing results after a delay
    setTimeout(() => {
      setShowResults(true);
    }, 1000);

    // Auto-close after showing results
    setTimeout(() => {
      onClose();
    }, 4000);
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / poll.duration) * 100;
    if (percentage > 50) return 'text-green-400';
    if (percentage > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    const percentage = (timeLeft / poll.duration) * 100;
    if (percentage > 50) return 'from-green-400 to-green-500';
    if (percentage > 25) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  // Mock results data
  const results = [
    { option: 'London', percentage: 15 },
    { option: 'Berlin', percentage: 8 },
    { option: 'Paris', percentage: 72 },
    { option: 'Madrid', percentage: 5 },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="glass-card w-full max-w-2xl mx-4 p-8 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Timer */}
          <div className="text-center mb-8">
            <motion.div
              className={`text-6xl font-bold mb-4 ${getTimeColor()}`}
              animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
            >
              {timeLeft}
            </motion.div>
            
            <div className="progress-bar mb-4">
              <motion.div
                className={`h-full bg-gradient-to-r ${getProgressColor()}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / poll.duration) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex items-center justify-center text-gray-300">
              <Clock className="w-4 h-4 mr-2" />
              Time remaining
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{poll.question}</h2>
            <p className="text-gray-300">Select your answer below</p>
          </div>

          {/* Options */}
          {!showResults ? (
            <div className="space-y-4 mb-8">
              {poll.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => !isSubmitted && setSelectedOption(index)}
                  disabled={isSubmitted}
                  className={`poll-option ${
                    selectedOption === index ? 'selected' : ''
                  } ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={!isSubmitted ? { scale: 1.02 } : undefined}
                  whileTap={!isSubmitted ? { scale: 0.98 } : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-4 text-white font-semibold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg">{option}</span>
                    {selectedOption === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <CheckCircle className="w-6 h-6 text-electric-cyan" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-white text-center mb-6">Results</h3>
              {poll.options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`poll-option ${
                    selectedOption === index ? 'selected' : ''
                  } ${index === 2 ? 'correct' : ''}`} // Assuming Paris is correct
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-4 text-white font-semibold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold mr-4">{results[index].percentage}%</span>
                      <div className="w-24 progress-bar">
                        <motion.div
                          className="h-full bg-gradient-to-r from-electric-cyan to-vibrant-magenta"
                          initial={{ width: 0 }}
                          animate={{ width: `${results[index].percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          {!isSubmitted && !showResults && (
            <div className="text-center">
              <motion.button
                onClick={submitAnswer}
                disabled={selectedOption === null || timeLeft === 0}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={selectedOption !== null ? { scale: 1.05 } : undefined}
                whileTap={selectedOption !== null ? { scale: 0.95 } : undefined}
              >
                Submit Answer
              </motion.button>
            </div>
          )}

          {/* Submitted State */}
          {isSubmitted && !showResults && (
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center text-green-400 text-lg"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                Answer submitted! Waiting for results...
              </motion.div>
            </div>
          )}

          {/* Results State */}
          {showResults && (
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className={`text-lg font-semibold mb-2 ${
                  selectedOption === 2 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedOption === 2 ? 'Correct!' : 'Incorrect'}
                </div>
                <p className="text-gray-300">
                  {selectedOption === 2 
                    ? 'Great job! You got it right.' 
                    : 'The correct answer was C. Paris'}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PollModal;