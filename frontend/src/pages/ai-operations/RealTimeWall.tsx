// File: frontend/src/pages/ai-operations/RealTimeWall.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { RealTimeOperationsWall } from '../../services/aiOperationsService';

interface RealTimeWallProps {
  wall?: RealTimeOperationsWall;
}

const RealTimeWall: React.FC<RealTimeWallProps> = ({ wall }) => {
  if (!wall) return null;

  const metrics = [
    {
      label: 'Tables Occupied',
      value: wall.tablesOccupied,
      icon: '🔴',
      textColor: 'text-rose-600 dark:text-rose-400',
      glow: 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20',
    },
    {
      label: 'Tables Available',
      value: wall.tablesAvailable,
      icon: '🟢',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      glow: 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20',
    },
    {
      label: 'Tables Cleaning',
      value: wall.tablesCleaning,
      icon: '🔵',
      textColor: 'text-sky-600 dark:text-sky-400',
      glow: 'border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20',
    },
    {
      label: 'Active Orders',
      value: wall.ordersActive,
      icon: '⚡',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      glow: 'border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/20',
    },
    {
      label: 'Delayed Orders',
      value: wall.ordersDelayed,
      icon: '⚠️',
      textColor: wall.ordersDelayed > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-[var(--text-muted)]',
      glow: wall.ordersDelayed > 0 ? 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20' : 'border-[var(--card-border)] bg-[var(--card-bg)]',
    },
    {
      label: 'Kitchen Load',
      value: `${wall.kitchenLoadPercent}%`,
      icon: '👨‍🍳',
      textColor: wall.kitchenLoadPercent >= 80 ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400',
      glow: wall.kitchenLoadPercent >= 80 ? 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20' : 'border-purple-500/30 bg-purple-500/10 dark:bg-purple-950/20',
    },
    {
      label: 'Pending Bills',
      value: wall.pendingBills,
      icon: '🧾',
      textColor: 'text-amber-600 dark:text-amber-300',
      glow: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20',
    },
    {
      label: 'Revenue Today',
      value: `$${wall.revenueToday.toFixed(0)}`,
      icon: '💰',
      textColor: 'text-[#0F6B4B] dark:text-emerald-400 font-extrabold',
      glow: 'border-[#0F6B4B]/30 bg-[#0F6B4B]/10 dark:bg-[#0F6B4B]/20',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className={`rounded-3xl border p-5 shadow-xs transition hover:scale-[1.02] ${m.glow}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-extrabold">{m.label}</span>
            <span className="text-base">{m.icon}</span>
          </div>
          <p className={`mt-3 text-2xl font-extrabold tracking-tight ${m.textColor}`}>
            {m.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default RealTimeWall;
