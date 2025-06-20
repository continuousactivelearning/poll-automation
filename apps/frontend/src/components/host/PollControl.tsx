import React, { useState } from 'react';

const PollControl: React.FC = () => {
  const [deliveryMode, setDeliveryMode] = useState<'auto' | 'manual' | 'save'>('auto');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || options.some(opt => !opt.trim())) {
      setMessage("Please fill in the question and all options.");
      return;
    }

    // Replace this with actual API call
    console.log("Submitting custom poll:", {
      question,
      options,
      mode: deliveryMode
    });

    setMessage("✅ Poll saved successfully!");
    setQuestion('');
    setOptions(['', '', '', '']);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
      {/* Delivery Mode */}
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">🛠️ Question Delivery Mode</h2>
        <div className="flex flex-wrap gap-4">
          {['auto', 'manual', 'save'].map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                value={mode}
                checked={deliveryMode === mode}
                onChange={() => setDeliveryMode(mode as any)}
                className="accent-blue-600"
              />
              {mode === 'auto' ? 'Auto-publish to dashboard' : mode === 'manual' ? 'Manual approval' : 'Save-only'}
            </label>
          ))}
        </div>
      </div>

      {/* Custom Poll Generator */}
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">📝 Custom Poll Generator</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poll Question</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your poll question..."
              required
            />
          </div>
          {options.map((opt, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option {index + 1}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={opt}
                onChange={(e) => {
                  const updated = [...options];
                  updated[index] = e.target.value;
                  setOptions(updated);
                }}
                placeholder={`Option ${index + 1}`}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            ➕ Create Poll
          </button>

          {message && <p className="text-green-600 font-medium mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default PollControl;
