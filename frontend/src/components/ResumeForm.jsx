import { useState, useRef } from 'react'

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

const emptyExp = () => ({ title: '', company: '', location: '', start: '', end: '', bullets: [''] })
const emptyEdu = () => ({ degree: '', school: '', location: '', start: '', end: '', details: '' })
const emptyVol = () => ({ role: '', organization: '', location: '', start: '', end: '', bullets: [''] })
const emptyLink = () => ({ label: '', url: '' })

export default function ResumeForm({ initialData, onSubmit, onSkipToPreview, submitLabel = 'Next: Tailor with AI →' }) {
  const [data, setData] = useState(initialData)
  const [skillInput, setSkillInput] = useState('')
  const [langInput, setLangInput] = useState('')
  const jsonRef = useRef()

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

  // --- JSON import ---
  function handleJsonImport(e) {
    try {
      const parsed = JSON.parse(e.target.value)
      setData(parsed)
    } catch {
      // silently ignore invalid JSON while typing
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* JSON Import */}
      <div className={CARD}>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
            Import from JSON (optional — paste existing resume data)
          </summary>
          <textarea
            ref={jsonRef}
            rows={6}
            placeholder='{ "name": "...", "experience": [...] }'
            className={`${INPUT} mt-3 font-mono text-xs`}
            onChange={handleJsonImport}
          />
        </details>
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
