import React from 'react';
import GlassCard from '../GlassCard';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react'; // Zap is a good icon for "launch"

export interface PollData {
    question: string;
    options: string[];
    correctOptionIndex: number;
}

interface PollDisplayProps {
    poll: PollData | null;
}

const PollDisplay: React.FC<PollDisplayProps> = ({ poll }) => {
    if (!poll) {
        return null;
    }
    
    // No more local state for selectedOption, we use poll.correctOptionIndex directly.
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">{poll.question}</h3>
                <p className="text-sm text-gray-400 mb-4">Review the poll below. The correct answer is marked.</p>
                <ul className="space-y-3">
                    {poll.options.map((option, index) => {
                        const isCorrect = index === poll.correctOptionIndex;
                        return (
                            <li 
                                key={index} 
                                // No onClick handler for changing selection
                                className={`flex items-center justify-between rounded-lg p-3 text-white transition-all duration-300
                                    ${isCorrect 
                                        ? 'bg-green-500/30 border-2 border-green-500 font-semibold' // Style for the correct answer
                                        : 'bg-charcoal/30'}` // Style for other options
                                }
                            >
                                <span>{option}</span>
                                {isCorrect && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </motion.div>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-6 flex justify-end">
                    <button className="btn-primary">
                      <Zap className="w-4 h-4 mr-2" />
                      Launch Poll
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default PollDisplay;