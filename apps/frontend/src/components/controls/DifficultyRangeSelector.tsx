import React from "react"

interface DifficultyRangeSelectorProps {
  value: string
  onChange: (value: string) => void
}

const difficultyLevels = [
  { id: "Easy", label: "Easy" },
  { id: "Medium", label: "Medium" },
  { id: "Hard", label: "Hard" },
  { id: "all", label: "All Levels" },
]

const DifficultyRangeSelector: React.FC<DifficultyRangeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-2">
      {difficultyLevels.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(level.id)}
          className={`px-4 py-2 rounded-lg font-medium border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${
            value === level.id
              ? "bg-primary-500/20 text-primary-400 border-primary-500/30 shadow-lg shadow-primary-500/20"
              : "bg-white/5 text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/10"
          }`}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}

export default DifficultyRangeSelector
