"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"

interface SourceToggleProps {
  source: "gemini" | "ollama"
  onToggle: (source: "gemini" | "ollama") => void
}

const SourceToggle: React.FC<SourceToggleProps> = ({ source, onToggle }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">AI Generation Source</label>
      <div className="relative">
        <motion.button
          onClick={() => onToggle(source === "gemini" ? "ollama" : "gemini")}
          className="relative flex items-center w-full p-3 bg-white/5 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div
              className={`p-2 rounded-lg transition-colors duration-200 ${
                source === "gemini" ? "bg-primary-500/20 text-primary-400" : "bg-gray-600/20 text-gray-400"
              }`}
            >
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-white font-medium">{source === "gemini" ? "Using Gemini API" : "Using Ollama"}</div>
              <div className="text-xs text-gray-400">
                {source === "gemini" ? "Google's advanced AI model" : "Local AI model processing"}
              </div>
            </div>
          </div>
          <div
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
              source === "gemini" ? "bg-primary-500" : "bg-gray-600"
            }`}
          >
            <motion.span
              className="inline-block w-4 h-4 transform bg-white rounded-full"
              animate={{ x: source === "gemini" ? 24 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </motion.button>
      </div>
    </div>
  )
}

export default SourceToggle
