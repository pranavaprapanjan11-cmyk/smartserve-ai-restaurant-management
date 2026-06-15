import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import * as menuService from '../../services/menuService'

const alerts = [
  { id: '1', type: 'Inventory', message: 'Low spice stock for Tandoori Masala', severity: 'critical' },
  { id: '2', type: 'Kitchen', message: '2 orders delayed by over 12 minutes', severity: 'warning' },
  { id: '3', type: 'Menu', message: 'Add seasonal items to boost Q4 revenue', severity: 'info' },
]

const notifications = [
  { id: '1', title: 'New kitchen SOP update', subtitle: 'Check the prep workflow for tonight service.' },
  { id: '2', title: 'Team shift reminder', subtitle: 'Waiter Mira is due for training at 6:00pm.' },
]

const CommandCenter: React.FC = () => {
  const [stats, setStats] = useState<menuService.MenuStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('auth_token') || ''
        const statsData = await menuService.getMenuStats(token)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to load command center stats', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const revenueVelocity = stats ? (stats.total_revenue / 7).toFixed(0) : '—'
  const kitchenHealth = stats ? Math.max(0, 90 - stats.bestsellers_count * 2) : 0
  const status = stats?.available_items && stats.available_items > 0 ? 'Operational' : 'At Risk'

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.25fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Command Center</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Operational Pulse</h2>
            </div>
            <div className="rounded-3xl bg-cyan-500/10 px-4 py-3 text-cyan-200 ring-1 ring-cyan-400/20">
              Live
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Revenue Velocity</p>
              <p className="mt-3 text-4xl font-semibold text-cyan-300">₹{revenueVelocity}/day</p>
              <p className="mt-2 text-sm text-slate-400">Projected seven-day momentum</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Kitchen Health</p>
              <p className="mt-3 text-4xl font-semibold text-emerald-300">{kitchenHealth}%</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${kitchenHealth}%` }} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Inventory Alerts</p>
              <p className="mt-3 text-4xl font-semibold text-amber-300">{alerts.length}</p>
              <p className="mt-2 text-sm text-slate-400">Active item alerts</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Restaurant Status</p>
              <p className="mt-3 text-4xl font-semibold text-white">{status}</p>
              <p className="mt-2 text-sm text-slate-400">Live availability and service readiness</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-amber-500/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Notifications</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Action Items</h3>
            </div>
            <div className="rounded-3xl bg-amber-400/10 px-4 py-3 text-amber-200 ring-1 ring-amber-300/20">
              {notifications.length} new
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {notifications.map((note) => (
              <div key={note.id} className="rounded-3xl border border-white/10 bg-[#09101c]/80 p-5">
                <p className="text-sm font-semibold text-white">{note.title}</p>
                <p className="mt-2 text-sm text-slate-400">{note.subtitle}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/70">Status Feed</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Operational Highlights</h3>
            </div>
            <span className="rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
              Real-time mock data
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Staff ready</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">17</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Tables seated</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">12 / 16</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Orders in kitchen</p>
              <p className="mt-3 text-3xl font-semibold text-white">9</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <p className="text-sm text-slate-400">Average ticket</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">₹1420</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-blue-500/5 backdrop-blur-xl"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Quick Actions</p>
          <h3 className="mt-4 text-2xl font-semibold text-white">Runbook</h3>
          <div className="mt-8 space-y-3">
            <button className="w-full rounded-3xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-left text-white transition hover:border-cyan-300/30 hover:bg-cyan-500/15">
              Review pending inventory alerts
            </button>
            <button className="w-full rounded-3xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-left text-white transition hover:border-amber-300/30 hover:bg-amber-500/15">
              Assign delayed orders to kitchen team
            </button>
            <button className="w-full rounded-3xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-left text-white transition hover:border-emerald-300/30 hover:bg-emerald-500/15">
              Inspect high-margin menu items
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default CommandCenter
