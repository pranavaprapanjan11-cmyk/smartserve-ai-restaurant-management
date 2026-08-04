// File: frontend/src/pages/ai-operations/HeatMaps.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { OperationalHeatmaps } from '../../services/aiOperationsService';

interface HeatMapsProps {
  heatmaps?: OperationalHeatmaps;
}

const HeatMaps: React.FC<HeatMapsProps> = ({ heatmaps }) => {
  if (!heatmaps) return null;

  const tables = heatmaps.tables || [];
  const hours = heatmaps.hours || [];

  // Table heat calculations
  const maxRevenue = Math.max(...tables.map((t) => t.revenue), 1);

  // Time heat calculations
  const maxOrders = Math.max(...hours.map((h) => h.orderCount), 1);
  const maxTimeRevenue = Math.max(...hours.map((h) => h.revenue), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Table Revenue Heatmap */}
      <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-extrabold">Floor Seat Utilization Heatmap</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Visual occupancy and billing revenue per physical table</p>

        <div className="mt-6 grid grid-cols-4 sm:grid-cols-5 gap-3.5">
          {tables.map((t, idx) => {
            const ratio = t.revenue / maxRevenue;
            let bgColor = 'bg-[var(--subheader-bg)] text-[var(--text-secondary)] border-[var(--card-border)]';
            
            if (ratio > 0.8) {
              bgColor = 'bg-[#0F6B4B]/20 text-[#0F6B4B] dark:text-[#4ADE80] border-[#0F6B4B]/40 font-bold';
            } else if (ratio > 0.5) {
              bgColor = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
            } else if (ratio > 0.2) {
              bgColor = 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
            }

            return (
              <motion.div
                key={t.tableNumber}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                className={`rounded-2xl border p-3 flex flex-col items-center justify-center text-center shadow-xs ${bgColor}`}
              >
                <span className="text-sm font-extrabold">T{t.tableNumber}</span>
                <span className="text-[10px] text-[var(--text-primary)] font-bold mt-1">${t.revenue.toFixed(0)}</span>
                <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{t.usageCount} orders</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hourly Load Heatmap */}
      <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-extrabold">Hourly Operational Load</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Order traffic density and total revenues hourly</p>

        <div className="mt-8 flex h-36 items-end justify-between gap-2.5">
          {hours.length === 0 ? (
            <div className="flex w-full h-full items-center justify-center text-xs text-[var(--text-muted)]">
              No hourly traffic recorded.
            </div>
          ) : (
            hours.map((h, idx) => {
              const heightPercent = Math.max(10, Math.round((h.orderCount / maxOrders) * 100));
              const revRatio = h.revenue / maxTimeRevenue;
              
              let barColor = 'bg-indigo-500/40';
              if (revRatio > 0.75) {
                barColor = 'bg-[#0F6B4B] dark:bg-[#4ADE80]';
              } else if (revRatio > 0.4) {
                barColor = 'bg-emerald-500';
              }

              return (
                <div key={h.hourLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold">${h.revenue.toFixed(0)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                    className={`w-full rounded-t-lg ${barColor} relative group`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block rounded bg-[var(--card-bg)] border border-[var(--card-border)] px-2 py-1 text-[9px] text-[var(--text-primary)] font-bold whitespace-nowrap z-10 shadow-lg">
                      Orders: {h.orderCount} | Avg Prep: {h.avgPrepTimeMinutes}m
                    </div>
                  </motion.div>
                  <span className="text-[9px] text-[var(--text-muted)] font-bold whitespace-nowrap">{h.hourLabel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMaps;
