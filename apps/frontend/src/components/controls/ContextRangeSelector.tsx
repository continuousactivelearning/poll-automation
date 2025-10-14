"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Globe, Clock, Calendar, Settings } from "lucide-react"

interface ContextRangeSelectorProps {
  contextRange: string
  customRange?: string
  onRangeChange: (range: string, customRange?: string) => void
}

const ContextRangeSelector: React.FC<ContextRangeSelectorProps> = ({ contextRange, customRange, onRangeChange }) => {
  const [isCustom, setIsCustom] = useState(contextRange === "custom")
  const [customMinutes, setCustomMinutes] = useState(5)
  const [customSeconds, setCustomSeconds] = useState(0)

  const ranges = [
    {
      id: "last5",
      label: "Last 5 minutes",
      icon: Clock,
      description: "Recent context",
    },
    {
      id: "last30",
      label: "Last 30 minutes",
      icon: Calendar,
      description: "Extended context",
    },
    {
      id: "session",
      label: "Entire session",
      icon: Globe,
      description: "Full context",
    },
  ]

  const handleRangeSelect = (rangeId: string) => {
    setIsCustom(false)
    onRangeChange(rangeId)
  }

  const handleCustomToggle = () => {
    const newIsCustom = !isCustom
    setIsCustom(newIsCustom)
    if (newIsCustom) {
      const customRangeString = `${customMinutes}:${customSeconds.toString().padStart(2, "0")}`
      onRangeChange("custom", customRangeString)
    }
  }

  const handleCustomChange = () => {
    const customRangeString = `${customMinutes}:${customSeconds.toString().padStart(2, "0")}`
    onRangeChange("custom", customRangeString)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">Contextual Range</label>

      <div className="space-y-2">
        {ranges.map((range) => {
          const isSelected = contextRange === range.id
          const Icon = range.icon

          return (
            <motion.button
              key={range.id}
              onClick={() => handleRangeSelect(range.id)}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 text-left ${
                isSelected
                  ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                  : "bg-white/5 text-gray-300 border-gray-600 hover:border-gray-500"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded transition-colors duration-200 ${
                    isSelected ? "bg-primary-500/30" : "bg-gray-600/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{range.label}</div>
                  <div className="text-xs opacity-75">{range.description}</div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                    isSelected ? "bg-primary-500 border-primary-500" : "border-gray-500"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full bg-white rounded-full scale-50"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}

        {/* Custom Range Option */}
        <motion.div
          className={`p-3 rounded-lg border transition-colors duration-200 ${
            isCustom
              ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
              : "bg-white/5 text-gray-300 border-gray-600"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded transition-colors duration-200 ${
                  isCustom ? "bg-primary-500/30" : "bg-gray-600/30"
                }`}
              >
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-sm">Custom Range</div>
                <div className="text-xs opacity-75">Set specific duration</div>
              </div>
            </div>
            <motion.button
              onClick={handleCustomToggle}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                isCustom ? "bg-primary-500 border-primary-500" : "border-gray-500"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isCustom && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-full h-full bg-white rounded-full scale-50"
                />
              )}
            </motion.button>
          </div>

          {isCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center space-x-2 mt-2"
            >
              <input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(Number.parseInt(e.target.value) || 0)
                  setTimeout(handleCustomChange, 100)
                }}
                className="w-16 px-2 py-1 bg-white/10 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">min</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => {
                  setCustomSeconds(Number.parseInt(e.target.value) || 0)
                  setTimeout(handleCustomChange, 100)
                }}
                className="w-16 px-2 py-1 bg-white/10 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">sec</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="text-xs text-gray-400">
        {contextRange === "custom"
          ? `Custom: ${customRange || "0:00"}`
          : `Using ${ranges.find((r) => r.id === contextRange)?.label.toLowerCase() || "default"} context`}
      </div>
    </div>
  )
}

export default ContextRangeSelector
