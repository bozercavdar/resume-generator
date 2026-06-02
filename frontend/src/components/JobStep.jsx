import { useState } from 'react'
import { adjustResume } from '../api'

export default function JobStep({ resumeData, initialJobDescription, onBack, onAdjusted }) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stored = sessionStorage.getItem('gemini_api_key') || ''
  const [apiKey, setApiKey] = useState(stored)
  const [editingKey, setEditingKey] = useState(!stored)
  const [showKey, setShowKey] = useState(false)

  async function handleTailor() {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      setError('Please enter your Gemini API key above.')
      return
    }
    if (!trimmedKey.startsWith('AIza')) {
      setError('This does not look like a valid Gemini API key (should start with "AIza").')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.')
      return
    }
    sessionStorage.setItem('gemini_api_key', trimmedKey)
    setEditingKey(false)
    setError('')
    setLoading(true)
    try {
      const adjusted = await adjustResume(resumeData, jobDescription, { role: role || undefined })
      onAdjusted(adjusted, jobDescription)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Tailor Your Resume</h2>
        <p className="text-sm text-gray-500 mb-5">
          Paste the job description below. The AI will rewrite your bullet points and summary to match — without inventing anything.
        </p>

        {/* API Key section */}
        <div className="mb-5">
          {!editingKey && apiKey ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                🔑 API key set
              </span>
              <button
                type="button"
                onClick={() => setEditingKey(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">Gemini API Key required for AI tailoring</p>
              <p className="text-xs text-amber-600 mb-3">
                Your key is stored only in this browser session.{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-800"
                >
                  Get one free at Google AI Studio ↗
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="w-full border border-amber-300 rounded-md px-3 py-2 pr-14 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-1"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {editingKey && stored && (
                  <button
                    type="button"
                    onClick={() => { setApiKey(stored); setEditingKey(false) }}
                    className="text-sm text-gray-500 border border-gray-300 rounded-md px-3 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Role <span className="text-gray-400 font-normal">(optional — helps focus the tone)</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Data Scientist, Software Engineer"
            value={role}
            onChange={e => setRole(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
          <textarea
            rows={14}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleTailor}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Tailoring…
            </>
          ) : (
            '✨ Tailor Resume'
          )}
        </button>
      </div>
    </div>
  )
}
