import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'
import LiveActivityOverlay from './LiveActivityOverlay'
import SimulationCenter from '../SimulationCenter'

const AppShell: React.FC = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getBreadcrumbs = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return ['Home']

    const categoryMap: Record<string, string> = {
      dashboard: 'Operations',
      waiter: 'Operations',
      kitchen: 'Operations',
      'digital-twin': 'Operations',
      menu: 'Restaurant',
      inventory: 'Restaurant',
      billing: 'Restaurant',
      analytics: 'Intelligence',
      ai: 'Intelligence',
      'ai-optimizer': 'Intelligence',
      employees: 'Administration',
      settings: 'Administration',
      'ai-vision': 'AI Intelligence Center',
      'ai-import': 'AI Intelligence Center'
    }

    const nameMap: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      waiter: 'Orders & Service',
      kitchen: 'Kitchen KDS',
      'digital-twin': 'Tables Layout',
      menu: 'Menu Operations',
      inventory: 'Inventory Hub',
      billing: 'Billing & Invoices',
      analytics: 'Analytics',
      ai: 'AI Intelligence',
      'ai-optimizer': 'AI Menu Optimizer',
      employees: 'Employee Directory',
      settings: 'Restaurant Settings',
      'ai-vision': 'AI Vision Center',
      'ai-import': 'AI Smart Import',
      create: 'Create Order',
      items: 'Items',
      recipes: 'Recipes',
      suppliers: 'Suppliers',
      'purchase-orders': 'Purchase Orders',
      transactions: 'Movements',
      alerts: 'Low Stock Alerts',
      editor: 'Invoice Editor',
      upload: 'Upload',
      review: 'Review'
    }

    const breadcrumbs: string[] = []
    const firstPart = parts[0]
    const category = categoryMap[firstPart]
    if (category) {
      breadcrumbs.push(category)
    }

    parts.forEach((part) => {
      const isId = part.length > 8 && (part.match(/^[0-9a-fA-F-]+$/) || part.match(/^\d+$/))
      if (isId) {
        breadcrumbs.push(`Order #${part.substring(0, 6).toUpperCase()}`)
      } else {
        const mapped = nameMap[part] || part.charAt(0).toUpperCase() + part.slice(1)
        if (mapped !== category) {
          breadcrumbs.push(mapped)
        }
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1F2937]">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Container */}
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? sidebarCollapsed ? '76px' : '250px'
            : '0px'
        }}
      >
        {/* Header Component */}
        <Header
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Sub-header Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#D1D5DB] bg-white px-6 py-2.5 gap-2">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4B5563]">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={bc}>
                {idx > 0 && <span className="text-gray-400 font-bold">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-[#0F6B4B] font-extrabold' : ''}>
                  {bc}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-between rounded-lg border border-[#D1D5DB] bg-gray-50 px-3 py-1.5 text-xs text-[#4B5563] font-semibold hover:bg-gray-100 hover:text-[#111827] transition w-full sm:w-56"
          >
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search commands...</span>
            </div>
            <kbd className="rounded bg-white px-1.5 py-0.5 border border-[#D1D5DB] text-[10px] font-mono font-bold text-[#4B5563]">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 relative p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Overlays */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <LiveActivityOverlay />
      <SimulationCenter />
    </div>
  )
}

export default AppShell
