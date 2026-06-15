import React, { useState } from 'react'
import { motion } from 'framer-motion'

const tableLayout = [
  { id: 'T1', seats: 4, occupied: true, status: 'Served', delay: 0, waiter: 'Mira' },
  { id: 'T2', seats: 2, occupied: false, status: 'Available', delay: 0, waiter: '—' },
  { id: 'T3', seats: 6, occupied: true, status: 'Awaiting', delay: 9, waiter: 'Ravi' },
  { id: 'T4', seats: 4, occupied: true, status: 'Cooking', delay: 14, waiter: 'Asha' },
  { id: 'T5', seats: 2, occupied: false, status: 'Reserved', delay: 0, waiter: '—' },
  { id: 'T6', seats: 8, occupied: true, status: 'Billed', delay: 0, waiter: 'Mira' },
]

const DigitalTwin: React.FC = () => {
  const [activeTable, setActiveTable] = useState(tableLayout[0])

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Restaurant Digital Twin</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Table Operations</h2>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
              Live Mock Mode
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Active tables</p>
              <p className="mt-3 text-4xl font-semibold text-white">{tableLayout.filter((table) => table.occupied).length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Delayed orders</p>
              <p className="mt-3 text-4xl font-semibold text-amber-300">{tableLayout.filter((table) => table.delay > 0).length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Waiter teams</p>
              <p className="mt-3 text-4xl font-semibold text-cyan-300">3</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tableLayout.map((table) => (
              <motion.button
                key={table.id}
                onClick={() => setActiveTable(table)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-3xl border p-4 text-left transition ${
                  activeTable.id === table.id
                    ? 'border-cyan-400/30 bg-cyan-500/10'
                    : 'border-white/10 bg-[#0c101c]/80 hover:border-cyan-400/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-white">{table.id}</p>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{table.seats} seats</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{table.status}</p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{table.occupied ? 'Occupied' : 'Available'}</span>
                  {table.delay > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">+{table.delay} min delay</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-amber-500/5 backdrop-blur-xl"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Table Detail</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{activeTable.id}</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Occupancy</p>
              <p className="mt-3 text-3xl font-semibold text-white">{activeTable.occupied ? 'Occupied' : 'Available'}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Waiter Assignment</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{activeTable.waiter}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Current order flow</p>
              <p className="mt-3 text-3xl font-semibold text-white">{activeTable.status}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Delay</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{activeTable.delay} min</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default DigitalTwin
