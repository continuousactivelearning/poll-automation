"use client"

import type React from "react"
import { motion } from "framer-motion"
import { CheckSquare, ToggleLeft, Edit, BarChart3 } from "lucide-react"

interface QuestionTypeSelectorProps {
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ selectedTypes, onTypesChange }) => {
  const questionTypes = [
    { id: "mcq", label: "Multiple Choice", icon: CheckSquare, description: "A, B, C, D options" },
    { id: "truefalse", label: "True/False", icon: ToggleLeft, description: "Binary choice" },
    { id: "shortanswer", label: "Short Answer", icon: Edit, description: "Text input" },
    { id: "opinion", label: "Opinion Poll", icon: BarChart3, description: "Rating scale" },
  ]

  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onTypesChange(selectedTypes.filter((t) => t !== typeId))
    } else {
      onTypesChange([...selectedTypes, typeId])
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">Question Type Preferences</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questionTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.id)
          const Icon = type.icon

          return (
            <motion.button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`p-3 rounded-lg border transition-colors duration-200 text-left ${
                isSelected
                  ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                  : "bg-white/5 text-gray-300 border-gray-600 hover:border-gray-500"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-1 rounded transition-colors duration-200 ${
                    isSelected ? "bg-primary-500/30" : "bg-gray-600/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs opacity-75 mt-1">{type.description}</div>
                </div>
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                    isSelected ? "bg-primary-500 border-primary-500" : "border-gray-500"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="text-xs text-gray-400">
        {selectedTypes.length === 0
          ? "Select at least one question type"
          : `${selectedTypes.length} type${selectedTypes.length !== 1 ? "s" : ""} selected`}
      </div>
    </div>
  )
}

export default QuestionTypeSelector
