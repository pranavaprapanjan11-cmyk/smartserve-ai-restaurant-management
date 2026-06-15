import React from 'react'
import { motion } from 'framer-motion'

const OcrPanel: React.FC = () => {
  const handleFileSelect = () => {
    console.log('OCR upload button clicked – integration pending')
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">OCR Panel</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Document Upload Zone</h1>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
            UI demo only
          </span>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-dashed border-white/10 bg-[#0c101c]/80 p-12 text-center">
          <div className="mx-auto flex h-48 w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-white/20 bg-slate-950/70 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-3xl text-cyan-300">
              📄
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Upload receipts, invoices, or kitchen sheets</p>
              <p className="mt-2 text-sm text-slate-400">No OCR processing yet — this panel is designed for future integration.</p>
            </div>
            <button
              type="button"
              onClick={handleFileSelect}
              className="mt-4 rounded-3xl bg-cyan-500/15 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Select Files
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default OcrPanel
