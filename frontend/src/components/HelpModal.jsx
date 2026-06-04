import { useEffect } from 'react'

export default function HelpModal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm text-gray-700">
          {children}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export function Section({ icon, title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-2">{icon} {title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function HelpItem({ label, children }) {
  return (
    <div>
      <p className="font-medium text-gray-800 mb-0.5">{label}</p>
      <p className="text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}
