import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeSwitcher from './ThemeSwitcher'
import axios from 'axios'
import { API_BASE } from '../../config'

interface HeaderProps {
  onToggleSidebar: () => void
  onOpenSearch: () => void
}

interface NotificationItem {
  id: string
  title: string
  subtitle: string
  time: string
  unread: boolean
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const { user, token, logout } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [bellShaking, setBellShaking] = useState(false)
  
  const [workspaceInfo, setWorkspaceInfo] = useState<{ code: string; name: string } | null>(null)

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/workspace/current`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setWorkspaceInfo({
          code: res.data.workspace_code,
          name: res.data.workspace_name
        })
      })
      .catch(() => {
        if (user?.workspace_code) {
          setWorkspaceInfo({
            code: user.workspace_code,
            name: ''
          })
        }
      })
    } else {
      setWorkspaceInfo(null)
    }
  }, [token, user?.workspace_code])
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'New kitchen SOP update', subtitle: 'Check prep workflow for tonight service.', time: '10m ago', unread: true },
    { id: '2', title: 'Team shift reminder', subtitle: 'Waiter Mira is due for training at 6:00pm.', time: '1h ago', unread: true },
    { id: '3', title: 'Low Stock Alert', subtitle: 'Tandoori Masala is running low in stock.', time: '3h ago', unread: false },
  ])

  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleNotify = () => {
      setBellShaking(true)
      setTimeout(() => setBellShaking(false), 1200)

      const newNotif: NotificationItem = {
        id: Date.now().toString(),
        title: 'New Live Event Received',
        subtitle: 'Simulated activity completed successfully.',
        time: 'Just now',
        unread: true
      }
      setNotifications(prev => [newNotif, ...prev])
    }

    window.addEventListener('liveActivityEvent', (e: any) => {
      if (e.detail?.type === 'notificationsBadge') {
        handleNotify()
      }
    })

    return () => {
      window.removeEventListener('liveActivityEvent', handleNotify)
    }
  }, [])

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [profileOpen, notificationsOpen])

  const getPageTitle = (pathname: string) => {
    if (pathname === '/dashboard') return 'Dashboard Overview'
    if (pathname === '/digital-twin') return 'Tables & Layout'
    if (pathname === '/waiter/dashboard') return 'Waiter Dashboard'
    if (pathname.startsWith('/waiter/orders/create')) return 'Create Order'
    if (pathname.match(/^\/waiter\/orders\/[^/]+$/)) return 'Order Details'
    if (pathname === '/menu') return 'Menu Operations'
    if (pathname.startsWith('/menu/add')) return 'Add Menu Item'
    if (pathname.startsWith('/menu/edit')) return 'Edit Menu Item'
    if (pathname.startsWith('/inventory/items')) return 'Inventory Items'
    if (pathname.startsWith('/inventory/recipes')) return 'Recipe Mapper'
    if (pathname.startsWith('/inventory/suppliers')) return 'Suppliers Directory'
    if (pathname.startsWith('/inventory/purchase-orders')) return 'Purchase Orders'
    if (pathname.startsWith('/inventory/transactions')) return 'Stock Movements'
    if (pathname.startsWith('/inventory/alerts')) return 'Low Stock Alerts'
    if (pathname === '/inventory') return 'Inventory Hub'
    if (pathname.startsWith('/billing/editor')) return 'Invoice Editor'
    if (pathname === '/billing') return 'Billing & Invoices'
    if (pathname === '/analytics') return 'Analytics & Insights'
    if (pathname === '/ai') return 'AI Intelligence'
    if (pathname === '/ai-optimizer') return 'AI Menu Optimizer'
    if (pathname === '/employees') return 'Employee Directory'
    if (pathname === '/settings') return 'Restaurant Settings'
    if (pathname === '/ai-vision' || pathname === '/ai-import') return 'Gemini Vision Document Intelligence'
    if (pathname === '/kitchen') return 'Kitchen Display System (KDS)'
    return 'Restaurant OS'
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-gray-50 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F6B4B] text-white text-xs font-extrabold shadow-sm">
            SS
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-extrabold text-[#111827] tracking-tight">SmartServe AI</span>
            <span className="ml-2 text-[10px] text-[#4B5563] font-bold uppercase tracking-wider">Restaurant OS</span>
          </div>
        </div>

        {workspaceInfo && (
          <div className="hidden lg:flex items-center gap-2 border-l border-[#D1D5DB] pl-3">
            <span className="text-[11px] font-bold text-[#4B5563]">Workspace:</span>
            <span className="text-xs font-bold text-[#0F6B4B] bg-[#0F6B4B]/10 border border-[#0F6B4B]/20 px-2 py-0.5 rounded-md font-mono">{workspaceInfo.code}</span>
            {workspaceInfo.name && (
              <span className="text-xs text-[#4B5563] font-medium max-w-[140px] truncate" title={workspaceInfo.name}>
                ({workspaceInfo.name.replace("'s Workspace", "")})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Section: Page Title */}
      <div className="text-center">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight md:text-lg">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          title="Search Menu (Ctrl+K)"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-gray-50 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${
              bellShaking ? 'animate-[bounce_0.3s_infinite]' : ''
            }`}
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 bg-gray-50">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-[#0F6B4B] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">No notifications</div>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 transition hover:bg-gray-50 ${
                          n.unread ? 'bg-[#0F6B4B]/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold ${n.unread ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 leading-normal">{n.subtitle}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* User Profile */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-gray-50 p-1 pr-2.5 text-left text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="flex h-7.5 w-7.5 items-center justify-center rounded-md bg-[#0F6B4B] text-xs font-bold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </span>
            <span className="hidden text-xs font-semibold lg:inline">{user?.name || 'Guest'}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-xl">
              <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1 bg-gray-50">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Guest User'}</p>
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-wide mt-0.5">Role: {user?.role || 'Guest'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
