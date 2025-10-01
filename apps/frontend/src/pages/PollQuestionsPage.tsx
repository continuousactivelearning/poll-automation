"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, Trophy, CheckCircle, X, ArrowRight } from "lucide-react"
import GlassCard from "../components/GlassCard"

interface Question {
  id: string
  question: string
  options: string[]
  timeLimit: number
  points: number
}

interface PollQuestionsPageProps {
  meetingLink: string
  onComplete?: () => void
}

const PollQuestionsPage: React.FC<PollQuestionsPageProps> = ({ meetingLink, onComplete }) => {
  const [questions] = useState<Question[]>([
    {
      id: "1",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      timeLimit: 30,
      points: 100,
    },
    {
      id: "2",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      timeLimit: 25,
      points: 150,
    },
    {
      id: "3",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      timeLimit: 15,
      points: 50,
    },
  ])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 30)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeUp()
    }
  }, [timeLeft, isAnswered])

  const handleTimeUp = () => {
    setIsAnswered(true)
    setShowResult(true)
    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return

    setSelectedAnswer(answer)
    setIsAnswered(true)
    setShowResult(true)

    // Simulate correct answer (in real app, this would come from backend)
    const isCorrect = answer === currentQuestion.options[2] // Assuming 3rd option is always correct for demo
    if (isCorrect) {
      setScore(score + currentQuestion.points)
    }

    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }

  const nextQuestion = () => {
    if (isLastQuestion) {
      onComplete?.()
      return
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setShowResult(false)
    setTimeLeft(questions[currentQuestionIndex + 1].timeLimit)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Live Poll Session</h1>
        <p className="text-gray-400">Connected to: {meetingLink}</p>
      </motion.div>

      {/* Progress Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-gray-400">Score: {score}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </GlassCard>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="p-8">
            {/* Timer */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-400" />
                <span className={`font-bold text-lg ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="flex items-center space-x-4 text-gray-400">
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{currentQuestion.points} pts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>24 participants</span>
                </div>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-white mb-8 text-center">{currentQuestion.question}</h2>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrect = showResult && option === currentQuestion.options[2] // Demo: 3rd option is correct
                const isWrong = showResult && isSelected && !isCorrect

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    whileHover={!isAnswered ? { scale: 1.02 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    className={`
                      p-6 rounded-xl border-2 transition-all duration-200 text-left
                      ${
                        isCorrect
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : isWrong
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : isSelected
                              ? "bg-primary-500/20 border-primary-500 text-primary-400"
                              : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                      }
                      ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="w-6 h-6" />}
                      {showResult && isWrong && <X className="w-6 h-6" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Next Button (for last question) */}
            {isLastQuestion && isAnswered && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
                <button
                  onClick={() => onComplete?.()}
                  className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                >
                  <span>View Results</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default PollQuestionsPage
