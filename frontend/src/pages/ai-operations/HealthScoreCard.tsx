// File: frontend/src/pages/ai-operations/HealthScoreCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { HealthMonitor } from '../../services/aiOperationsService';

interface HealthScoreCardProps {
  monitor?: HealthMonitor;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ monitor }) => {
  if (!monitor) return null;

  const score = monitor.overallScore;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getSeverityColor = (label: string) => {
    switch (label) {
      case 'Excellent':
        return 'text-emerald-600 dark:text-emerald-400 stroke-emerald-600 dark:stroke-emerald-400';
      case 'Good':
        return 'text-[#0F6B4B] dark:text-emerald-400 stroke-[#0F6B4B] dark:stroke-emerald-400';
      case 'Needs Attention':
        return 'text-amber-600 dark:text-amber-400 stroke-amber-600 dark:stroke-amber-400';
      default:
        return 'text-rose-600 dark:text-rose-500 stroke-rose-600 dark:stroke-rose-500';
    }
  };

  const getSubcategoryProgressColor = (label: string) => {
    switch (label) {
      case 'Excellent':
        return 'bg-emerald-600 dark:bg-emerald-400';
      case 'Good':
        return 'bg-[#0F6B4B] dark:bg-emerald-400';
      case 'Needs Attention':
        return 'bg-amber-500';
      default:
        return 'bg-rose-500';
    }
  };

  const subcategories = [
    { name: 'Revenue Health', score: monitor.revenueHealth.score, label: monitor.revenueHealth.label },
    { name: 'Kitchen Health', score: monitor.kitchenHealth.score, label: monitor.kitchenHealth.label },
    { name: 'Billing Health', score: monitor.billingHealth.score, label: monitor.billingHealth.label },
    { name: 'Inventory Health', score: monitor.inventoryHealth.score, label: monitor.inventoryHealth.label },
    { name: 'Table Utilization', score: monitor.tableUtilization.score, label: monitor.tableUtilization.label },
    { name: 'Staff Performance', score: monitor.staffPerformance.score, label: monitor.staffPerformance.label },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.8fr_1.2fr]">
      {/* Circular Progress Gauge */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-card-enterprise">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-extrabold">SmartServe Health Score</h3>
        <div className="relative mt-8 flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full rotate-[-90deg]">
            {/* Background Circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-[var(--card-border)] fill-none"
              strokeWidth="10"
            />
            {/* Animated Gauge Progress */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              className={`fill-none ${getSeverityColor(getGrade(score))}`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-extrabold text-[var(--text-primary)]"
            >
              {score}
            </motion.span>
            <span className="text-4xs uppercase tracking-widest text-[var(--text-muted)] mt-0.5 font-bold">/ 100</span>
          </div>
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
          {getGrade(score)} Operations
        </p>
      </div>

      {/* Subcategory Bars */}
      <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">Operational Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {subcategories.map((sub, idx) => (
            <div key={idx} className="space-y-1.5 rounded-2xl border border-[var(--card-border)] bg-[var(--subheader-bg)] p-4">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-[var(--text-secondary)]">{sub.name}</span>
                <span className="font-bold text-[var(--text-primary)]">{sub.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--card-border)]">
                <motion.div
                  className={`h-full rounded-full ${getSubcategoryProgressColor(sub.label)}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${sub.score}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                {sub.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

export default HealthScoreCard;
