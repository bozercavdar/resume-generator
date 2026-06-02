export default function ResumePreview({ resume }) {
  if (!resume) return null

  return (
    <div className="bg-white text-gray-900 font-sans text-[10pt] leading-[1.35]" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <div className="text-[16pt] font-bold">{resume.name}</div>
        <div className="text-[9pt] text-gray-700 mt-1">
          {[resume.location, resume.phone, resume.email].filter(Boolean).join(' • ')}
          {resume.links?.map((l, i) => (
            <span key={i}> • <a href={l.url} className="text-blue-800 no-underline">{l.label}</a></span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <>
          <SectionTitle>Professional Summary</SectionTitle>
          <p className="text-[10pt] mb-2">{resume.summary}</p>
        </>
      )}

      {/* Experience */}
      {resume.experience?.length > 0 && (
        <>
          <SectionTitle>Work Experience</SectionTitle>
          {resume.experience.map((job, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[10pt]">{job.title} – {job.company}</span>
                <span className="text-[9pt] italic text-gray-600 whitespace-nowrap ml-2">
                  {job.start} – {job.end}{job.location ? ` | ${job.location}` : ''}
                </span>
              </div>
              <ul className="mt-1 mb-2 pl-4 list-disc">
                {job.bullets?.map((b, j) => <li key={j} className="mb-0.5 text-[10pt]">{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {resume.education?.length > 0 && (
        <>
          <SectionTitle>Education</SectionTitle>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[10pt]">{edu.degree}, {edu.school}</span>
                <span className="text-[9pt] italic text-gray-600 whitespace-nowrap ml-2">
                  {edu.start} – {edu.end}{edu.location ? ` | ${edu.location}` : ''}
                </span>
              </div>
              {edu.details && <p className="text-[10pt] mt-0.5">{edu.details}</p>}
            </div>
          ))}
        </>
      )}

      {/* Volunteering */}
      {resume.volunteering?.length > 0 && (
        <>
          <SectionTitle>Volunteering &amp; Leadership</SectionTitle>
          {resume.volunteering.map((vol, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[10pt]">{vol.role} – {vol.organization}</span>
                <span className="text-[9pt] italic text-gray-600 whitespace-nowrap ml-2">
                  {vol.start} – {vol.end}{vol.location ? ` | ${vol.location}` : ''}
                </span>
              </div>
              <ul className="mt-1 mb-2 pl-4 list-disc">
                {vol.bullets?.map((b, j) => <li key={j} className="mb-0.5 text-[10pt]">{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Skills */}
      {resume.skills && (
        <>
          <SectionTitle>Skills</SectionTitle>
          {resume.skills.technical?.length > 0 && (
            <p className="text-[10pt] mb-1"><strong>Technical:</strong> {resume.skills.technical.join(', ')}</p>
          )}
          {resume.skills.languages?.length > 0 && (
            <p className="text-[10pt]"><strong>Languages:</strong> {resume.skills.languages.join(', ')}</p>
          )}
        </>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="font-bold uppercase border-b border-black mt-3 mb-1.5 text-[10pt]">
      {children}
    </div>
  )
}
