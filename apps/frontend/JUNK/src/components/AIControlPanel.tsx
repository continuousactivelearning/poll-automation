"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Save, RotateCcw, Zap, Check } from "lucide-react"
import GlassCard from "./GlassCard"
import SourceToggle from "./controls/SourceToggle"
import FrequencySelector from "./controls/FrequencySelector"
import QuestionQuantitySlider from "./controls/QuestionQunatitySlider"
import QuestionTypeSelector from "./controls/QuestionTypeSelector"
import ContextRangeSelector from "./controls/ContextRangeSelector"
import DifficultyRangeSelector from "./controls/DifficultyRangeSelector"


export interface AIControlPanelProps {
  isOpen: boolean
  onToggle: () => void
  showFloatingButton: boolean
  questionsPerPoll: number
  setQuestionsPerPoll: React.Dispatch<React.SetStateAction<number>>
}
interface AIConfig {
  source: "gemini" | "ollama"
  frequency: number
  quantity: number
  types: string[]
  contextRange: string
  customRange?: string
}

const defaultConfig: AIConfig = {
  source: "gemini",
  frequency: 5,
  quantity: 3,
  types: ["mcq", "truefalse"],
  contextRange: "last5",
}
const defaultDifficulty = "all"

const AIControlPanel: React.FC<AIControlPanelProps> = ({ isOpen, onToggle, showFloatingButton = true }) => {
  const [config, setConfig] = useState<AIConfig>(defaultConfig)
  const [difficulty, setDifficulty] = useState<string>(defaultDifficulty)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSavedPopup, setShowSavedPopup] = useState(false)

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    console.log("Saving AI configuration:", config)
    setHasUnsavedChanges(false)

    // Show success feedback
    setShowSavedPopup(true)
    setTimeout(() => setShowSavedPopup(false), 2000)
  }

  const handleReset = () => {
    const isConfigChanged = JSON.stringify(config) !== JSON.stringify(defaultConfig)
    const isDifficultyChanged = difficulty !== defaultDifficulty
    setConfig(defaultConfig)
    setDifficulty(defaultDifficulty)
    setHasUnsavedChanges(isConfigChanged || isDifficultyChanged)
  }

  return (
    <>
      {/* Saved Successfully Popup */}
      <AnimatePresence>
        {showSavedPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-8 right-8 z-[100] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <Check className="w-5 h-5 text-white" />
            <span>Saved Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel Toggle Button - Only show when showFloatingButton is true */}
      {showFloatingButton && (
        <motion.button
          onClick={onToggle}
          className={`fixed top-4 right-4 z-50 p-3 rounded-full backdrop-blur-md border transition-colors duration-200 ${
            isOpen
              ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
              : "bg-white/10 text-gray-300 border-gray-600 hover:border-gray-500"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <Settings className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
        </motion.button>
      )}

      {/* Control Panel Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={onToggle}
      />

      {/* Control Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-md border-l border-gray-700 z-50 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary-400" />
                AI Control Panel
              </h2>
              <p className="text-sm text-gray-400 mt-1">Configure question generation behavior</p>
            </div>
            {hasUnsavedChanges && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
          </div>

          {/* Configuration Sections */}
          <div className="space-y-6">
            {/* Configuration Summary */}
          <GlassCard className="p-4 bg-primary-500/5 border-primary-500/20">
            <h3 className="text-sm font-medium text-primary-400 mb-3">Current Configuration</h3>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="text-primary-400 capitalize">{config.source}</span>
              </div>
              <div className="flex justify-between">
                <span>Frequency:</span>
                <span>Every {config.frequency} min</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{config.quantity} questions</span>
              </div>
              <div className="flex justify-between">
                <span>Types:</span>
                <span>{config.types.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span>Context:</span>
                <span className="capitalize">
                  {config.contextRange === "custom" ? config.customRange : config.contextRange.replace("last", "Last ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty Level:</span>
                <span className="capitalize">{difficulty === "all" ? "All Levels" : difficulty}</span>
              </div>
            </div>
          </GlassCard>
          
            {/* Source Toggle */}
            <GlassCard className="p-4">
              <SourceToggle source={config.source} onToggle={(source) => updateConfig({ source })} />
            </GlassCard>

            {/* Frequency Selector */}
            <GlassCard className="p-4">
              <FrequencySelector
                frequency={config.frequency}
                onFrequencyChange={(frequency) => updateConfig({ frequency })}
              />
            </GlassCard>

            {/* Question Quantity */}
            <GlassCard className="p-4">
              <QuestionQuantitySlider
                quantity={config.quantity}
                onQuantityChange={(quantity) => updateConfig({ quantity })}
              />
            </GlassCard>

            {/* Question Types */}
            <GlassCard className="p-4">
              <QuestionTypeSelector selectedTypes={config.types} onTypesChange={(types) => updateConfig({ types })} />
            </GlassCard>

            {/* Context Range */}
            <GlassCard className="p-4">
              <ContextRangeSelector
                contextRange={config.contextRange}
                customRange={config.customRange}
                onRangeChange={(contextRange, customRange) => updateConfig({ contextRange, customRange })}
              />
            </GlassCard>

            {/* Difficulty Level Selector */}
            <GlassCard className="p-4">
              <div className="mb-2 text-sm font-medium text-gray-300">Difficulty Level</div>
              <DifficultyRangeSelector value={difficulty} onChange={handleDifficultyChange} />
            </GlassCard>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <motion.button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                hasUnsavedChanges
                  ? "bg-primary-500 text-white hover:bg-primary-600"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              whileHover={hasUnsavedChanges ? { scale: 1.02 } : {}}
              whileTap={hasUnsavedChanges ? { scale: 0.98 } : {}}
            >
              <Save className="w-4 h-4" />
              <span>Save Config</span>
            </motion.button>

            <motion.button
              onClick={handleReset}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
          </div>

          
        </div>
      </motion.div>
    </>
  )
}

export default AIControlPanel
