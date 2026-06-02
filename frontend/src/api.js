function geminiKeyHeader() {
  const key = sessionStorage.getItem('gemini_api_key')
  return key ? { 'X-Gemini-Key': key } : {}
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...geminiKeyHeader() },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res
}

export async function adjustResume(resumeData, jobDescription, { role, strict } = {}) {
  const res = await request('/api/resume/adjust', {
    method: 'POST',
    body: JSON.stringify({ resume_data: resumeData, job_description: jobDescription, role, strict }),
  })
  return res.json()
}

export async function downloadPdf(resumeData) {
  const res = await request('/api/resume/pdf', {
    method: 'POST',
    body: JSON.stringify({ resume_data: resumeData }),
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${resumeData['name'].replace(/ /g, '_')}_Resume.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function generateCoverLetter(resumeData, jobDescription, { company, role } = {}) {
  const res = await request('/api/cover-letter', {
    method: 'POST',
    body: JSON.stringify({ resume_data: resumeData, job_description: jobDescription, company, role }),
  })
  return res.json() // { text: string }
}

export async function downloadCoverLetterDocx(text, name, email) {
  const res = await request('/api/cover-letter/download', {
    method: 'POST',
    body: JSON.stringify({ text, name, email }),
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/ /g, '_')}_Cover_Letter.docx`
  a.click()
  URL.revokeObjectURL(url)
}
