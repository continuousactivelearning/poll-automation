"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Edit3 } from "lucide-react"

interface FrequencySelectorProps {
  frequency: number
  onFrequencyChange: (frequency: number) => void
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ frequency, onFrequencyChange }) => {
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState(frequency)

  const presets = [
    { label: "1 min", value: 1 },
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "30 min", value: 30 },
  ]

  const handlePresetSelect = (value: number) => {
    setIsCustom(false)
    onFrequencyChange(value)
  }

  const handleCustomSubmit = () => {
    if (customValue > 0) {
      onFrequencyChange(customValue)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300 flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        Question Frequency
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {presets.map((preset) => (
          <motion.button
            key={preset.value}
            onClick={() => handlePresetSelect(preset.value)}
            className={`p-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              frequency === preset.value && !isCustom
                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                : "bg-white/5 text-gray-300 border border-gray-600 hover:border-gray-500"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <motion.button
          onClick={() => setIsCustom(!isCustom)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            isCustom
              ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
              : "bg-white/5 text-gray-300 border border-gray-600 hover:border-gray-500"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Edit3 className="w-4 h-4" />
          <span>Custom</span>
        </motion.button>

        {isCustom && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center space-x-2"
          >
            <input
              type="number"
              min="1"
              max="120"
              value={customValue}
              onChange={(e) => setCustomValue(Number.parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 bg-white/10 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="min"
            />
            <span className="text-gray-400 text-sm">min</span>
            <motion.button
              onClick={handleCustomSubmit}
              className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm hover:bg-primary-500/30 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Set
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        Current: Every {frequency} minute{frequency !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

export default FrequencySelector
