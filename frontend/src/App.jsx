import { useState } from 'react'
import StepBar from './components/StepBar'
import ResumeForm from './components/ResumeForm'
import JobStep from './components/JobStep'
import PreviewStep from './components/PreviewStep'

const EMPTY_RESUME = {
  name: '', location: '', phone: '', email: '',
  links: [],
  summary: '',
  experience: [],
  education: [],
  volunteering: [],
  skills: { technical: [], languages: [] },
}

export default function App() {
  const [step, setStep] = useState(1)
  const [resumeData, setResumeData] = useState(EMPTY_RESUME)
  const [jobDescription, setJobDescription] = useState('')
  const [adjustedData, setAdjustedData] = useState(null)

  function handleResumeSubmit(data) {
    setResumeData(data)
    setStep(2)
  }

  function handleSkipToPreview(data) {
    setResumeData(data)
    setAdjustedData(data)
    setJobDescription('')
    setStep(3)
  }

  function handleAdjusted(data, jd) {
    setJobDescription(jd)
    setAdjustedData(data)
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <h1 className="text-xl font-bold text-gray-900">Resume Generator</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <StepBar current={step} />

        {step === 1 && (
          <ResumeForm
            initialData={resumeData}
            onSubmit={handleResumeSubmit}
            onSkipToPreview={handleSkipToPreview}
          />
        )}
        {step === 2 && (
          <JobStep
            resumeData={resumeData}
            initialJobDescription={jobDescription}
            onBack={() => setStep(1)}
            onAdjusted={handleAdjusted}
          />
        )}
        {step === 3 && (
          <PreviewStep
            adjustedData={adjustedData}
            originalData={resumeData}
            jobDescription={jobDescription}
            onBack={() => setStep(2)}
            onEditResume={(data) => {
              setResumeData(data)
              setAdjustedData(data)
            }}
          />
        )}
      </main>
    </div>
  )
}
