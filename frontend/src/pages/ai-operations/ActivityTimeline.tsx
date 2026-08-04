// File: frontend/src/pages/ai-operations/ActivityTimeline.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityEvent } from '../../services/aiOperationsService';

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  const getEventAnimationDetails = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'WAITER_ASSIGNED':
        return {
          icon: '🚶👔',
          badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          animate: { x: [-10, 10, 0] },
          transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        };
      case 'ORDER_PREPARING':
      case 'CHEF_STARTED_ORDER':
        return {
          icon: '👨‍🍳🔥',
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          animate: { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] },
          transition: { repeat: Infinity, duration: 1.5 },
        };
      case 'ORDER_READY':
      case 'CHEF_COMPLETED_ORDER':
        return {
          icon: '🛎️🍕',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          animate: { y: [0, -5, 0] },
          transition: { repeat: Infinity, duration: 1 },
        };
      case 'ORDER_SERVED':
      case 'STOCK_REDUCED':
      case 'WAITER_COMPLETED_SERVICE':
        return {
          icon: '🍽️',
          badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
          animate: { x: [0, 15, 0] },
          transition: { duration: 1.5, repeat: Infinity },
        };
      case 'BILL_REQUESTED':
      case 'INVOICE_GENERATED':
        return {
          icon: '🧾💵',
          badgeClass: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
          animate: { skewX: [0, 10, -10, 0] },
          transition: { repeat: Infinity, duration: 2 },
        };
      case 'PAYMENT_COMPLETED':
      case 'PAYMENT_RECEIVED':
      case 'SPLIT_PAYMENT':
        return {
          icon: '💸💰',
          badgeClass: 'bg-[#0F6B4B]/10 text-[#0F6B4B] dark:text-[#4ADE80] border-[#0F6B4B]/30',
          animate: { rotateY: [0, 180, 360] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'TABLE_CLEANING':
        return {
          icon: '🧹🧼',
          badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          animate: { rotate: [0, 360] },
          transition: { repeat: Infinity, duration: 2.5, ease: 'linear' },
        };
      case 'TABLE_AVAILABLE':
        return {
          icon: '🟢',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          animate: { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'LOW_STOCK':
      case 'alert-out':
        return {
          icon: '⚠️📦',
          badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 1, repeat: Infinity },
        };
      default:
        return {
          icon: '📢',
          badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          animate: {},
          transition: {},
        };
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-extrabold">Restaurant Activity Timeline</h3>
        <span className="rounded-full bg-[#0F6B4B]/10 dark:bg-[#0F6B4B]/20 border border-[#0F6B4B]/30 px-2.5 py-1 text-[10px] font-extrabold text-[#0F6B4B] dark:text-[#4ADE80]">
          Live stream
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-2 max-h-[480px] space-y-4">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-[var(--text-muted)]">
              No recent activity events logged.
            </div>
          ) : (
            events.map((event) => {
              const details = getEventAnimationDetails(event.event_type);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative flex gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--subheader-bg)] p-4 transition hover:border-[#0F6B4B]/40"
                >
                  {/* Event Icon with Framer Motion Animation */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] relative shadow-xs">
                    <motion.span
                      animate={details.animate}
                      transition={details.transition as any}
                      className="text-lg"
                    >
                      {details.icon}
                    </motion.span>
                  </div>

                  {/* Event text and timestamp */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${details.badgeClass}`}>
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[var(--text-primary)] leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityTimeline;
