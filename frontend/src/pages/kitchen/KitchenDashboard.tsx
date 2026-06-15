import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import * as kitchenService from '../../services/kitchenService'
import KitchenTicket from './KitchenTicket'
import KitchenMetrics from './KitchenMetrics'

const KitchenDashboard: React.FC = () => {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [newOrders, setNewOrders] = useState<any[]>([])
  const [preparing, setPreparing] = useState<any[]>([])
  const [ready, setReady] = useState<any[]>([])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await kitchenService.getKitchenOrders(token)
      setNewOrders(res.newOrders)
      setPreparing(res.preparing)
      setReady(res.ready)
    } catch (err) {
      console.error('Failed to load kitchen orders', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('ordersUpdated', onUpdate)
    const iv = setInterval(load, 10000)
    return () => {
      window.removeEventListener('ordersUpdated', onUpdate)
      clearInterval(iv)
    }
  }, [load])

  const handleAction = async (order: any) => {
    if (!token) return
    try {
      if (order.status === 'NEW') {
        await kitchenService.startCooking(order.id, token)
      } else if (order.status === 'PREPARING' || order.status === 'SENT_TO_KITCHEN') {
        await kitchenService.markReady(order.id, token)
      } else if (order.status === 'READY') {
        await kitchenService.markServed(order.id, token)
      }

      // notify other panels
      window.dispatchEvent(new CustomEvent('ordersUpdated'))
      // local refresh
      await load()
    } catch (err) {
      console.error('Failed to update order status', err)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Kitchen</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Kitchen Display System</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-400/20 hover:bg-cyan-500/15">
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm text-slate-400 uppercase">NEW</h3>
              <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {loading ? <div className="h-24 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"/></div> : newOrders.map(o => (
                  <KitchenTicket key={o.id} order={o} onAction={handleAction} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-400 uppercase">PREPARING</h3>
              <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {preparing.map(o => (
                  <KitchenTicket key={o.id} order={o} onAction={handleAction} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-400 uppercase">READY</h3>
              <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {ready.map(o => (
                  <KitchenTicket key={o.id} order={o} onAction={handleAction} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
          <KitchenMetrics orders={[...newOrders, ...preparing, ...ready]} />
        </motion.aside>
      </section>
    </div>
  )
}

export default KitchenDashboard
