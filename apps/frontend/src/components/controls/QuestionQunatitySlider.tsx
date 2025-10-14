"use client"

import type React from "react"
import { Hash } from "lucide-react"

interface QuestionQuantitySliderProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  min?: number
  max?: number
}

const QuestionQuantitySlider: React.FC<QuestionQuantitySliderProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 10,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300 flex items-center">
        <Hash className="w-4 h-4 mr-2" />
        Questions per Poll
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{min}</span>
          <span className="text-sm font-medium text-white">
            {quantity} Question{quantity !== 1 ? "s" : ""} per poll
          </span>
          <span className="text-xs text-gray-400">{max}</span>
        </div>

        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={quantity}
            onChange={(e) => onQuantityChange(Number.parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${((quantity - min) / (max - min)) * 100}%, rgb(55 65 81) ${((quantity - min) / (max - min)) * 100}%, rgb(55 65 81) 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
            style={{ left: `calc(${((quantity - min) / (max - min)) * 100}% - 8px)` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Minimal</span>
          <span>Comprehensive</span>
        </div>
      </div>
    </div>
  )
}

export default QuestionQuantitySlider
