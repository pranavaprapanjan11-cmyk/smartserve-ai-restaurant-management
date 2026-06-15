import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Command Center', to: '/dashboard' },
  { label: 'Digital Twin', to: '/digital-twin' },
  { label: 'Menu Matrix', to: '/menu' },
  { label: 'OCR Panel', to: '/ocr' },
  { label: 'AI Optimizer', to: '/ai-optimizer' },
]

const TopNav: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070A13]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10">
            OS
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">SmartServe</p>
            <h1 className="text-xl font-semibold text-white">Restaurant Operating System</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15"
          >
            Sign Out
          </button>
          <div className="hidden min-w-[180px] flex-col items-end rounded-3xl border border-white/10 bg-slate-950/60 p-3 text-right shadow-xl shadow-black/20 md:flex">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Operator</p>
            <p className="text-sm font-semibold text-white">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-400">{user?.role || 'Unknown role'}</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default TopNav
