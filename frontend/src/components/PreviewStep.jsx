import { useState, useRef, useEffect } from 'react'
import ResumePreview from './ResumePreview'
import ResumeForm from './ResumeForm'
import { downloadPdf, generateCoverLetter, downloadCoverLetterDocx } from '../api'

// A4 at 96 dpi
const A4_W = 794
const A4_H = 1093
const A4_PAD = 38 // 10 mm margin — matches the PDF template

export default function PreviewStep({ adjustedData, originalData, jobDescription, onBack, onEditResume }) {
  const [editMode, setEditMode] = useState(false)
  const [currentData, setCurrentData] = useState(adjustedData)
  const contentRef = useRef()
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    if (contentRef.current) {
      const h = contentRef.current.offsetHeight
      setPageCount(Math.max(1, Math.ceil(h / A4_H)))
    }
  })

  const [coverLetterText, setCoverLetterText] = useState('')
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingCl, setLoadingCl] = useState(false)
  const [loadingClDownload, setLoadingClDownload] = useState(false)
  const [error, setError] = useState('')

  async function handleDownloadPdf() {
    setError('')
    setLoadingPdf(true)
    try {
      await downloadPdf(currentData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleGenerateCoverLetter() {
    setError('')
    setLoadingCl(true)
    try {
      const { text } = await generateCoverLetter(currentData, jobDescription)
      setCoverLetterText(text)
      setShowCoverLetter(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingCl(false)
    }
  }

  async function handleDownloadCoverLetter() {
    setError('')
    setLoadingClDownload(true)
    try {
      await downloadCoverLetterDocx(coverLetterText, currentData.name, currentData.email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingClDownload(false)
    }
  }

  function handleFormSave(data) {
    setCurrentData(data)
    onEditResume(data)
    setEditMode(false)
  }

  return (
    <div>
      {/* Action bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => setEditMode(v => !v)}
            className={`px-4 py-2 text-sm border rounded-lg font-medium transition-colors
              ${editMode ? 'bg-gray-100 border-gray-400 text-gray-700' : 'border-gray-300 text-gray-600 hover:text-gray-900'}`}
          >
            {editMode ? 'Cancel Edit' : '✏️ Edit Resume'}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative group">
            <button
              type="button"
              onClick={handleGenerateCoverLetter}
              disabled={loadingCl || !jobDescription}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {loadingCl ? <Spinner /> : '📝'} Cover Letter
            </button>
            {!jobDescription && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center text-xs bg-gray-800 text-white rounded px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                Add a job description in Step 2 to enable cover letter
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loadingPdf ? <Spinner white /> : '⬇️'} Download PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      {/* Edit mode — show the full form pre-filled */}
      {editMode && (
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-sm text-amber-800">
            Editing the AI-adjusted resume. Click <strong>Save Changes</strong> to update the preview.
          </div>
          <ResumeForm initialData={currentData} onSubmit={handleFormSave} submitLabel="Save Changes" />
        </div>
      )}

      {/* PDF-page preview */}
      {!editMode && (
        <div className="rounded-xl overflow-hidden border border-gray-400 shadow-sm">
          {/* Viewer toolbar */}
          <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">
              Resume Preview — A4
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {pageCount} page{pageCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Viewer canvas */}
          <div className="bg-gray-500 overflow-auto py-8 px-4" style={{ maxHeight: '85vh' }}>
            {/* A4 page box */}
            <div
              className="relative bg-white shadow-2xl mx-auto"
              style={{ width: A4_W, minHeight: A4_H }}
            >
              {/* Content with PDF-matching margins */}
              <div
                ref={contentRef}
                style={{ padding: A4_PAD }}
              >
                <ResumePreview resume={currentData} />
              </div>

              {/* Page-break lines — one per boundary */}
              {Array.from({ length: pageCount - 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 pointer-events-none z-10"
                  style={{ top: A4_H * (i + 1) }}
                >
                  <div className="relative">
                    <div className="border-t-2 border-dashed border-red-500" />
                    <span className="absolute right-3 -top-5 text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded">
                      Page {i + 2}
                    </span>
                  </div>
                </div>
              ))}

              {/* First page boundary — always visible as a guide */}
              <div
                className="absolute left-0 right-0 pointer-events-none z-10"
                style={{ top: A4_H }}
              >
                <div className="relative">
                  <div className={`border-t-2 border-dashed ${pageCount > 1 ? 'border-red-500' : 'border-gray-300'}`} />
                  {pageCount === 1 && (
                    <span className="absolute right-3 -top-5 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      End of page 1
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover letter panel */}
      {showCoverLetter && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cover Letter</span>
            <button
              type="button"
              onClick={handleDownloadCoverLetter}
              disabled={loadingClDownload}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {loadingClDownload ? <Spinner /> : '⬇️'} Download .docx
            </button>
          </div>
          <div className="p-6">
            <textarea
              rows={20}
              className="w-full text-sm text-gray-800 border-0 resize-none focus:outline-none leading-relaxed"
              value={coverLetterText}
              onChange={e => setCoverLetterText(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner({ white }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${white ? 'text-white' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
