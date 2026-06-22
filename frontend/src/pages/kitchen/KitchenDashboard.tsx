import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as kitchenService from '../../services/kitchenService';
import * as inventoryService from '../../services/inventoryService';
import OrderCard from './OrderCard';
import KitchenMetrics from './KitchenMetrics';
import { triggerLiveActivity } from '../../utils/activityTrigger';

// Reusable Empty State component for columns
const EmptyColumnState: React.FC<{ type: 'NEW' | 'COOKING' | 'READY' }> = ({ type }) => {
  const getMessage = () => {
    switch (type) {
      case 'NEW':
        return 'No orders waiting';
      case 'COOKING':
        return 'Kitchen is clear';
      case 'READY':
        return 'No dishes waiting to serve';
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'NEW':
        return 'text-sky-400/30';
      case 'COOKING':
        return 'text-amber-400/30';
      case 'READY':
        return 'text-emerald-400/30';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
      <svg className={`h-12 w-12 ${getAccentColor()}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
      <p className="mt-4 text-sm text-slate-500 font-medium">{getMessage()}</p>
    </div>
  );
};

const KitchenDashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [preparing, setPreparing] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await kitchenService.getKitchenOrders(token);
      setNewOrders(res.newOrders || []);
      setPreparing(res.preparing || []);
      setReady(res.ready || []);
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load kitchen orders', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener('ordersUpdated', onUpdate);
    const iv = setInterval(load, 10000);
    return () => {
      window.removeEventListener('ordersUpdated', onUpdate);
      clearInterval(iv);
    };
  }, [load]);

  const handleAction = async (order: any) => {
    if (!token) return;
    try {
      if (order.status === 'NEW') {
        await kitchenService.startCooking(order.id, token);
        triggerLiveActivity('cookingStarted', { orderId: order.id });
      } else if (order.status === 'PREPARING' || order.status === 'SENT_TO_KITCHEN') {
        await kitchenService.markReady(order.id, token);
        triggerLiveActivity('orderReady', { orderId: order.id, tableNumber: order.table_number });
      } else if (order.status === 'READY') {
        await kitchenService.markServed(order.id, token);
        triggerLiveActivity('orderServed', { orderId: order.id, tableNumber: order.table_number });
      }

      // notify other panels
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      // local refresh
      await load();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const handleRemake = async (orderId: string, itemId: string, reason: string) => {
    if (!token) return;
    try {
      setLoading(true);
      await inventoryService.remakeOrderItem(orderId, itemId, reason, token);
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
      await load();
      alert('Dish remake request sent successfully! Inventory waste logged.');
    } catch (err: any) {
      console.error('Failed to remake item:', err);
      alert('Error remaking item: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Kitchen</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Kitchen Display System</h2>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-medium">
              Last Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={load}
            className="rounded-2xl bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/20 hover:bg-cyan-500/15 transition-all active:scale-[0.97]"
          >
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* NEW ORDERS Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">NEW ORDERS</h3>
                </div>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 ring-1 ring-sky-400/20">
                  {newOrders.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {loading && newOrders.length === 0 ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  </div>
                ) : newOrders.length === 0 ? (
                  <EmptyColumnState type="NEW" />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {newOrders.map((o) => (
                      <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="NEW" />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* COOKING Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">COOKING</h3>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-400/20">
                  {preparing.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {preparing.length === 0 ? (
                  <EmptyColumnState type="COOKING" />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {preparing.map((o) => (
                      <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="COOKING" />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* READY Column */}
            <div className="flex flex-col h-full min-h-[60vh]">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">READY</h3>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
                  {ready.length}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {ready.length === 0 ? (
                  <EmptyColumnState type="READY" />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {ready.map((o) => (
                      <OrderCard key={o.id} order={o} onAction={handleAction} onRemake={handleRemake} columnType="READY" />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Metrics Sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl"
        >
          <KitchenMetrics orders={[...newOrders, ...preparing, ...ready]} />
        </motion.aside>
      </section>
    </div>
  );
};

export default KitchenDashboard;
