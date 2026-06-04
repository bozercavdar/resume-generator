import { useState, useRef, useCallback } from 'react'
import { importResumeFromPdf } from '../api'

const INPUT = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const BTN_GHOST = 'text-sm text-blue-600 hover:text-blue-800 font-medium'
const BTN_REMOVE = 'text-sm text-red-400 hover:text-red-600 ml-2'
const CARD = 'bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm'

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {onAdd && (
        <button type="button" onClick={onAdd} className={BTN_GHOST}>
          + {addLabel}
        </button>
      )}
    </div>
  )
}

function validateResumeJson(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj))
    return 'File must contain a JSON object, not an array or primitive.'
  for (const key of ['name', 'experience', 'education', 'skills']) {
    if (!(key in obj)) return `Missing required field: "${key}".`
  }
  if (typeof obj.name !== 'string') return '"name" must be a string.'
  if (!Array.isArray(obj.experience)) return '"experience" must be an array.'
  if (!Array.isArray(obj.education)) return '"education" must be an array.'
  if (typeof obj.skills !== 'object' || Array.isArray(obj.skills))
    return '"skills" must be an object.'
  if (!Array.isArray(obj.skills.technical)) return '"skills.technical" must be an array.'
  if (!Array.isArray(obj.skills.languages)) return '"skills.languages" must be an array.'
  return null
}

const emptyExp = () => ({ title: '', company: '', location: '', start: '', end: '', bullets: [''] })
const emptyEdu = () => ({ degree: '', school: '', location: '', start: '', end: '', details: '' })
const emptyVol = () => ({ role: '', organization: '', location: '', start: '', end: '', bullets: [''] })
const emptyLink = () => ({ label: '', url: '' })

export default function ResumeForm({ initialData, onSubmit, onSkipToPreview, submitLabel = 'Next: Tailor with AI →' }) {
  const [data, setData] = useState(initialData)
  const [skillInput, setSkillInput] = useState('')
  const [langInput, setLangInput] = useState('')
  const [importStatus, setImportStatus] = useState(null) // null | { ok: true, name } | { ok: false, msg }
  const fileInputRef = useRef()

  // PDF import state
  const [pdfStatus, setPdfStatus] = useState(null) // null | 'loading' | { ok: true } | { ok: false, msg }
  const [showPdfKeySection, setShowPdfKeySection] = useState(false)
  const [pdfKeyInput, setPdfKeyInput] = useState('')
  const [showPdfKeyValue, setShowPdfKeyValue] = useState(false)
  const pdfFileRef = useRef()

  // --- generic setters ---
  const set = (key, val) => setData(d => ({ ...d, [key]: val }))
  const setSkills = (key, val) => setData(d => ({ ...d, skills: { ...d.skills, [key]: val } }))

  // --- array item updaters ---
  function updateItem(key, i, field, val) {
    setData(d => ({ ...d, [key]: d[key].map((it, idx) => idx === i ? { ...it, [field]: val } : it) }))
  }
  function removeItem(key, i) {
    setData(d => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }))
  }

  // --- bullets inside experience / volunteering ---
  function updateBullet(arrayKey, itemIdx, bulletIdx, val) {
    setData(d => ({
      ...d,
      [arrayKey]: d[arrayKey].map((item, i) =>
        i !== itemIdx ? item : {
          ...item,
          bullets: item.bullets.map((b, j) => j === bulletIdx ? val : b),
        }
      ),
    }))
  }
  function addBullet(arrayKey, itemIdx) {
    setData(d => ({
      ...d,
      [arrayKey]: d[arrayKey].map((item, i) =>
        i !== itemIdx ? item : { ...item, bullets: [...item.bullets, ''] }
      ),
    }))
  }
  function removeBullet(arrayKey, itemIdx, bulletIdx) {
    setData(d => ({
      ...d,
      [arrayKey]: d[arrayKey].map((item, i) =>
        i !== itemIdx ? item : {
          ...item,
          bullets: item.bullets.filter((_, j) => j !== bulletIdx),
        }
      ),
    }))
  }

  // --- skill tag helpers ---
  function addSkillTag(key, input, setInput) {
    const trimmed = input.trim()
    if (!trimmed) return
    setSkills(key, [...data.skills[key], trimmed])
    setInput('')
  }
  function removeSkillTag(key, i) {
    setSkills(key, data.skills[key].filter((_, idx) => idx !== i))
  }

  // --- JSON file import ---
  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const validationError = validateResumeJson(parsed)
        if (validationError) {
          setImportStatus({ ok: false, msg: validationError })
        } else {
          setData(parsed)
          setImportStatus({ ok: true, name: file.name })
        }
      } catch {
        setImportStatus({ ok: false, msg: 'File is not valid JSON.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // --- PDF import ---
  function handlePdfButtonClick() {
    const stored = sessionStorage.getItem('gemini_api_key')
    if (stored) {
      pdfFileRef.current?.click()
    } else {
      setShowPdfKeySection(true)
    }
  }

  function handlePdfKeySubmit() {
    const trimmed = pdfKeyInput.trim()
    if (!trimmed.startsWith('AIza')) {
      setPdfStatus({ ok: false, msg: 'Invalid key — should start with "AIza".' })
      return
    }
    sessionStorage.setItem('gemini_api_key', trimmed)
    setShowPdfKeySection(false)
    pdfFileRef.current?.click()
  }

  const handlePdfFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPdfStatus('loading')
    try {
      const parsed = await importResumeFromPdf(file)
      setData(parsed)
      setPdfStatus({ ok: true })
    } catch (err) {
      setPdfStatus({ ok: false, msg: err.message })
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Import */}
      <div className={CARD}>
        <p className="text-sm font-semibold text-gray-800 mb-3">Import Resume</p>

        <div className="flex flex-wrap gap-3 items-start">
          {/* JSON import */}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileImport} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
            >
              📂 Import JSON
            </button>
            {importStatus && (
              importStatus.ok
                ? <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">✓ {importStatus.name}</span>
                : <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">✕ {importStatus.msg}</span>
            )}
          </div>

          {/* PDF import */}
          <div className="flex items-center gap-2">
            <input ref={pdfFileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfFileChange} />
            <button
              type="button"
              onClick={handlePdfButtonClick}
              disabled={pdfStatus === 'loading'}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
            >
              {pdfStatus === 'loading'
                ? <><PdfSpinner /> Extracting…</>
                : '📄 Import from PDF'}
            </button>
            {pdfStatus && pdfStatus !== 'loading' && (
              pdfStatus.ok
                ? <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">✓ Imported</span>
                : <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">✕ {pdfStatus.msg}</span>
            )}
          </div>
        </div>

        {/* Inline API key prompt */}
        {showPdfKeySection && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">Gemini API key required for PDF import</p>
            <p className="text-xs text-amber-600 mb-3">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800">
                Get one free at Google AI Studio ↗
              </a>
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPdfKeyValue ? 'text' : 'password'}
                  className="w-full border border-amber-300 rounded-md px-3 py-2 pr-14 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="AIza..."
                  value={pdfKeyInput}
                  onChange={e => setPdfKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePdfKeySubmit()}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" onClick={() => setShowPdfKeyValue(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-1">
                  {showPdfKeyValue ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="button" onClick={handlePdfKeySubmit} className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600">
                Continue
              </button>
              <button type="button" onClick={() => setShowPdfKeySection(false)} className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Review reminder after PDF import */}
        {pdfStatus?.ok && (
          <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
            <span className="text-yellow-500 mt-0.5">⚠</span>
            <p className="text-xs text-yellow-800">
              <strong>Review carefully.</strong> AI extraction may miss details or mis-classify sections. Check every field before proceeding.
            </p>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className={CARD}>
        <SectionHeader title="Personal Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Full Name *">
            <input required className={INPUT} value={data.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={INPUT} value={data.email} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={INPUT} value={data.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={INPUT} value={data.location} onChange={e => set('location', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Links */}
      <div className={CARD}>
        <SectionHeader title="Links" onAdd={() => set('links', [...data.links, emptyLink()])} addLabel="Add Link" />
        {data.links.length === 0 && <p className="text-sm text-gray-400">No links added yet.</p>}
        {data.links.map((link, i) => (
          <div key={i} className="flex gap-3 mb-2 items-start">
            <div className="flex-1">
              <input placeholder="Label (e.g. LinkedIn)" className={INPUT} value={link.label} onChange={e => updateItem('links', i, 'label', e.target.value)} />
            </div>
            <div className="flex-[2]">
              <input placeholder="URL" className={INPUT} value={link.url} onChange={e => updateItem('links', i, 'url', e.target.value)} />
            </div>
            <button type="button" onClick={() => removeItem('links', i)} className={`${BTN_REMOVE} mt-2`}>✕</button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={CARD}>
        <SectionHeader title="Professional Summary" />
        <textarea
          rows={4}
          className={INPUT}
          placeholder="Brief professional summary..."
          value={data.summary || ''}
          onChange={e => set('summary', e.target.value)}
        />
      </div>

      {/* Experience */}
      <div className={CARD}>
        <SectionHeader title="Work Experience" onAdd={() => set('experience', [...data.experience, emptyExp()])} addLabel="Add Position" />
        {data.experience.length === 0 && <p className="text-sm text-gray-400">No experience added yet.</p>}
        {data.experience.map((exp, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">{exp.title || `Position ${i + 1}`}</span>
              <button type="button" onClick={() => removeItem('experience', i)} className="text-sm text-red-400 hover:text-red-600">Remove</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Job Title *">
                <input required className={INPUT} value={exp.title} onChange={e => updateItem('experience', i, 'title', e.target.value)} />
              </Field>
              <Field label="Company *">
                <input required className={INPUT} value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} />
              </Field>
              <Field label="Location">
                <input className={INPUT} value={exp.location} onChange={e => updateItem('experience', i, 'location', e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Field label="Start">
                  <input placeholder="MM/YYYY" className={INPUT} value={exp.start} onChange={e => updateItem('experience', i, 'start', e.target.value)} />
                </Field>
                <Field label="End">
                  <input placeholder="MM/YYYY or Present" className={INPUT} value={exp.end} onChange={e => updateItem('experience', i, 'end', e.target.value)} />
                </Field>
              </div>
            </div>
            <div className="mt-2">
              <label className={LABEL}>Bullet Points</label>
              {exp.bullets.map((b, j) => (
                <div key={j} className="flex gap-2 mb-1 items-center">
                  <span className="text-gray-400 text-sm mt-2">•</span>
                  <textarea
                    rows={2}
                    className={`${INPUT} resize-none`}
                    value={b}
                    onChange={e => updateBullet('experience', i, j, e.target.value)}
                  />
                  {exp.bullets.length > 1 && (
                    <button type="button" onClick={() => removeBullet('experience', i, j)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addBullet('experience', i)} className={`${BTN_GHOST} mt-1 text-xs`}>+ Add bullet</button>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className={CARD}>
        <SectionHeader title="Education" onAdd={() => set('education', [...data.education, emptyEdu()])} addLabel="Add Education" />
        {data.education.length === 0 && <p className="text-sm text-gray-400">No education added yet.</p>}
        {data.education.map((edu, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">{edu.degree || `Entry ${i + 1}`}</span>
              <button type="button" onClick={() => removeItem('education', i)} className="text-sm text-red-400 hover:text-red-600">Remove</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Degree *">
                <input required className={INPUT} value={edu.degree} onChange={e => updateItem('education', i, 'degree', e.target.value)} />
              </Field>
              <Field label="School *">
                <input required className={INPUT} value={edu.school} onChange={e => updateItem('education', i, 'school', e.target.value)} />
              </Field>
              <Field label="Location">
                <input className={INPUT} value={edu.location || ''} onChange={e => updateItem('education', i, 'location', e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Field label="Start">
                  <input placeholder="MM/YYYY" className={INPUT} value={edu.start || ''} onChange={e => updateItem('education', i, 'start', e.target.value)} />
                </Field>
                <Field label="End *">
                  <input required placeholder="MM/YYYY" className={INPUT} value={edu.end} onChange={e => updateItem('education', i, 'end', e.target.value)} />
                </Field>
              </div>
            </div>
            <Field label="Details">
              <input className={INPUT} value={edu.details || ''} onChange={e => updateItem('education', i, 'details', e.target.value)} />
            </Field>
          </div>
        ))}
      </div>

      {/* Volunteering */}
      <div className={CARD}>
        <SectionHeader title="Volunteering & Leadership" onAdd={() => set('volunteering', [...data.volunteering, emptyVol()])} addLabel="Add Entry" />
        {data.volunteering.length === 0 && <p className="text-sm text-gray-400">No entries added yet.</p>}
        {data.volunteering.map((vol, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">{vol.role || `Entry ${i + 1}`}</span>
              <button type="button" onClick={() => removeItem('volunteering', i)} className="text-sm text-red-400 hover:text-red-600">Remove</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field label="Role">
                <input className={INPUT} value={vol.role} onChange={e => updateItem('volunteering', i, 'role', e.target.value)} />
              </Field>
              <Field label="Organization">
                <input className={INPUT} value={vol.organization} onChange={e => updateItem('volunteering', i, 'organization', e.target.value)} />
              </Field>
              <Field label="Location">
                <input className={INPUT} value={vol.location || ''} onChange={e => updateItem('volunteering', i, 'location', e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Field label="Start">
                  <input placeholder="MM/YYYY" className={INPUT} value={vol.start} onChange={e => updateItem('volunteering', i, 'start', e.target.value)} />
                </Field>
                <Field label="End">
                  <input placeholder="MM/YYYY" className={INPUT} value={vol.end} onChange={e => updateItem('volunteering', i, 'end', e.target.value)} />
                </Field>
              </div>
            </div>
            <div className="mt-2">
              <label className={LABEL}>Bullet Points</label>
              {vol.bullets.map((b, j) => (
                <div key={j} className="flex gap-2 mb-1 items-center">
                  <span className="text-gray-400 text-sm mt-2">•</span>
                  <textarea rows={2} className={`${INPUT} resize-none`} value={b} onChange={e => updateBullet('volunteering', i, j, e.target.value)} />
                  {vol.bullets.length > 1 && (
                    <button type="button" onClick={() => removeBullet('volunteering', i, j)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addBullet('volunteering', i)} className={`${BTN_GHOST} mt-1 text-xs`}>+ Add bullet</button>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className={CARD}>
        <SectionHeader title="Skills" />
        <div className="mb-4">
          <label className={LABEL}>Technical Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.skills.technical.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                {s}
                <button type="button" onClick={() => removeSkillTag('technical', i)} className="text-blue-400 hover:text-blue-700 leading-none">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={`${INPUT} flex-1`}
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag('technical', skillInput, setSkillInput) } }}
            />
            <button type="button" onClick={() => addSkillTag('technical', skillInput, setSkillInput)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200">Add</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Languages</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.skills.languages.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full border border-green-200">
                {s}
                <button type="button" onClick={() => removeSkillTag('languages', i)} className="text-green-400 hover:text-green-700 leading-none">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={`${INPUT} flex-1`}
              placeholder='e.g. "English – Professional"'
              value={langInput}
              onChange={e => setLangInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag('languages', langInput, setLangInput) } }}
            />
            <button type="button" onClick={() => addSkillTag('languages', langInput, setLangInput)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200">Add</button>
          </div>
        </div>
      </div>

      {/* JSON export reminder */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mt-6">
        <span className="text-blue-500 text-base leading-none mt-0.5">💡</span>
        <p className="text-sm text-blue-700">
          <strong>Don't forget to export your data.</strong> Use the <em>Export JSON</em> button below to save your resume as a file — you can import it next time to skip re-entering everything.
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${data.name.trim().replace(/\s+/g, '_') || 'resume'}_data.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
        >
          ⬇ Export JSON
        </button>
        <div className="flex items-center gap-3">
          {onSkipToPreview && (
            <button
              type="button"
              onClick={() => onSkipToPreview(data)}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Skip to Preview →
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function PdfSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
