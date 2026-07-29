import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as menuService from '../../services/menuService'
import * as orderService from '../../services/orderService'
import * as tableService from '../../services/tableService'
import * as inventoryService from '../../services/inventoryService'

const CommandCenter: React.FC = () => {
  const { token, sseActive } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<menuService.MenuStats | null>(null)
  const [orders, setOrders] = useState<orderService.Order[]>([])
  const [alerts, setAlerts] = useState<{ id: string; type: string; message: string; severity: 'critical' | 'warning' | 'info' }[]>([])
  const [notifications, setNotifications] = useState<{ id: string; title: string; subtitle: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async (showLoading = true) => {
      if (!token) return
      if (showLoading) setIsLoading(true)
      try {
        const [statsData, ordersRes, lowStockRes, tablesRes] = await Promise.all([
          menuService.getMenuStats(token).catch(() => null),
          orderService.getOrders(token).catch(() => []),
          inventoryService.getLowStockItems(token).catch(() => []),
          tableService.getTables(token).catch(() => [])
        ])

        const ordersData = Array.isArray(ordersRes) ? ordersRes : []
        const lowStockItems = Array.isArray(lowStockRes) ? lowStockRes : []
        const tablesData = Array.isArray(tablesRes) ? tablesRes : []

        setStats(statsData)
        setOrders(ordersData)

        // Process alerts
        const now = new Date()
        const delayedOrders = ordersData.filter(o => {
          if (!o || o.status === orderService.OrderStatus.PAID || o.status === orderService.OrderStatus.REFUNDED) return false
          const activeStates = [
            orderService.OrderStatus.NEW,
            orderService.OrderStatus.SENT_TO_KITCHEN,
            orderService.OrderStatus.PREPARING,
            orderService.OrderStatus.READY
          ]
          if (!activeStates.includes(o.status)) return false
          if (!o.created_at) return false
          const createdTime = new Date(o.created_at)
          const diffMin = (now.getTime() - createdTime.getTime()) / (1000 * 60)
          return diffMin > 15
        })

        const liveAlerts: { id: string; type: string; message: string; severity: 'critical' | 'warning' | 'info' }[] = [
          ...lowStockItems.map(item => ({
            id: `inv-${item.id}`,
            type: 'Inventory',
            message: `${item.name} is low (On hand: ${item.quantity_on_hand} ${item.unit})`,
            severity: 'critical' as const
          })),
          ...delayedOrders.map(o => ({
            id: `order-${o.id}`,
            type: 'Kitchen',
            message: `Order #${(o.id || '').substring(0, 8)} for Table ${o.table_number} is delayed (> 15 mins)`,
            severity: 'warning' as const
          }))
        ]

        if (liveAlerts.length === 0) {
          liveAlerts.push({
            id: 'info-1',
            type: 'System',
            message: 'All kitchen prep stations operating within target duration.',
            severity: 'info' as const
          })
        }
        setAlerts(liveAlerts)

        // Process notifications
        const cleaningTables = tablesData.filter(t => t && t.status === tableService.TableStatus.CLEANING)
        const reservedTables = tablesData.filter(t => t && t.status === tableService.TableStatus.RESERVED)

        const liveNotifications = [
          ...cleaningTables.map(t => ({
            id: `cleaning-${t.id}`,
            title: `Table ${t.table_number} needs cleaning`,
            subtitle: `Ready for bussing and sanitation.`
          })),
          ...reservedTables.map(t => ({
            id: `reserved-${t.id}`,
            title: `Reservation: Table ${t.table_number}`,
            subtitle: `Reserved for ${t.reserved_for || 'Guest'} at ${t.reservation_time ? new Date(t.reservation_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}.`
          }))
        ]

        if (liveNotifications.length === 0) {
          liveNotifications.push(
            { id: 'note-1', title: 'New kitchen SOP update', subtitle: 'Check the prep workflow for tonight service.' },
            { id: 'note-2', title: 'Team shift reminder', subtitle: 'Waiter Mira is due for training at 6:00pm.' }
          )
        }
        setNotifications(liveNotifications)

      } catch (err) {
        console.error('Failed to load command center data', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    loadData(true)
    const onOrdersUpdated = () => loadData(false)
    window.addEventListener('ordersUpdated', onOrdersUpdated)
    window.addEventListener('order_created', onOrdersUpdated)
    window.addEventListener('order_updated', onOrdersUpdated)
    window.addEventListener('order_completed', onOrdersUpdated)
    window.addEventListener('order_cancelled', onOrdersUpdated)

    let iv: any = null;
    if (!sseActive) {
      iv = setInterval(() => loadData(false), 2000);
    }

    return () => {
      window.removeEventListener('ordersUpdated', onOrdersUpdated)
      window.removeEventListener('order_created', onOrdersUpdated)
      window.removeEventListener('order_updated', onOrdersUpdated)
      window.removeEventListener('order_completed', onOrdersUpdated)
      window.removeEventListener('order_cancelled', onOrdersUpdated)
      if (iv) clearInterval(iv)
    }
  }, [token, sseActive])

  const activeOrdersCount = orders.filter(o => o.status !== orderService.OrderStatus.PAID).length
  const preparingOrdersCount = orders.filter(
    o => o.status === orderService.OrderStatus.SENT_TO_KITCHEN || o.status === orderService.OrderStatus.PREPARING
  ).length
  const readyOrdersCount = orders.filter(o => o.status === orderService.OrderStatus.READY).length
  const servedOrdersCount = orders.filter(o => o.status === orderService.OrderStatus.SERVED).length

  const revenueVelocity = stats ? (stats.total_revenue / 7).toFixed(0) : '—'
  const kitchenHealth = stats ? Math.max(0, 90 - stats.bestsellers_count * 2) : 0
  const status = stats?.available_items && stats.available_items > 0 ? 'Operational' : 'At Risk'

  return (
    <div className="space-y-8 text-[#111827]">
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.25fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm space-y-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F6B4B]">Command Center</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#111827] tracking-tight">Operational Pulse</h2>
            </div>
            <div className="rounded-full bg-[#0F6B4B]/10 px-3.5 py-1 text-xs font-bold text-[#0F6B4B] border border-[#0F6B4B]/30">
              Live Real-Time
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Revenue Velocity</p>
              <p className="mt-2 text-3xl font-extrabold text-[#0F6B4B]">₹{revenueVelocity}/day</p>
              <p className="mt-1 text-xs text-[#4B5563] font-medium">Projected 7-day momentum</p>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Kitchen Health</p>
              <p className="mt-2 text-3xl font-extrabold text-[#15803D]">{kitchenHealth}%</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200 border border-gray-300">
                <div className="h-full rounded-full bg-[#15803D]" style={{ width: `${kitchenHealth}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Inventory Alerts</p>
              <p className="mt-2 text-3xl font-extrabold text-[#B45309]">{alerts.length}</p>
              <p className="mt-1 text-xs text-[#4B5563] font-medium">Active item warnings</p>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Restaurant Status</p>
              <p className="mt-2 text-3xl font-extrabold text-[#111827]">{status}</p>
              <p className="mt-1 text-xs text-[#4B5563] font-medium">Live availability & service readiness</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#B45309]">Notifications</p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#111827]">Action Items</h3>
            </div>
            <div className="rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-[#B45309] border border-amber-300">
              {notifications.length} new
            </div>
          </div>

          <div className="space-y-3">
            {notifications.map((note) => (
              <div key={note.id} className="rounded-lg border border-[#D1D5DB] bg-gray-50 p-4">
                <p className="text-xs font-extrabold text-[#111827]">{note.title}</p>
                <p className="mt-1 text-xs text-[#4B5563] font-medium">{note.subtitle}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F6B4B]">Live Operations</p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#111827]">Order Metrics</h3>
            </div>
            <span className="rounded-full bg-[#0F6B4B]/10 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#0F6B4B] border border-[#0F6B4B]/30">
              Real-Time Sync
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Active Orders</p>
              <p className="mt-2 text-3xl font-extrabold text-[#0F6B4B]">{activeOrdersCount}</p>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Preparing Orders</p>
              <p className="mt-2 text-3xl font-extrabold text-[#B45309]">{preparingOrdersCount}</p>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Ready Orders</p>
              <p className="mt-2 text-3xl font-extrabold text-[#15803D]">{readyOrdersCount}</p>
            </div>
            <div className="rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] p-5">
              <p className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">Served Orders</p>
              <p className="mt-2 text-3xl font-extrabold text-[#111827]">{servedOrdersCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F6B4B]">Quick Actions</p>
            <h3 className="mt-1 text-2xl font-extrabold text-[#111827]">Operations Runbook</h3>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] px-4 py-3.5 text-left text-xs font-extrabold text-[#111827] hover:bg-gray-100 hover:border-[#0F6B4B] transition"
            >
              Review pending inventory alerts &rarr;
            </button>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] px-4 py-3.5 text-left text-xs font-extrabold text-[#111827] hover:bg-gray-100 hover:border-[#0F6B4B] transition"
            >
              Assign delayed orders to kitchen team &rarr;
            </button>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="w-full rounded-lg border border-[#D1D5DB] bg-[#F8FAF9] px-4 py-3.5 text-left text-xs font-extrabold text-[#111827] hover:bg-gray-100 hover:border-[#0F6B4B] transition"
            >
              Inspect high-margin menu items &rarr;
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default CommandCenter
