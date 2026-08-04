// File: frontend/src/pages/ai-operations/RecommendationPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { OperationalRecommendation } from '../../services/aiOperationsService';

interface RecommendationPanelProps {
  recommendations: OperationalRecommendation[];
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ recommendations }) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300';
      case 'MEDIUM':
        return 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300';
      default:
        return 'border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300';
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-card-enterprise h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-extrabold">AI Operational Recommendations</h3>
        <span className="rounded-full bg-[#0F6B4B]/10 dark:bg-[#0F6B4B]/20 border border-[#0F6B4B]/30 px-2.5 py-1 text-[10px] font-extrabold text-[#0F6B4B] dark:text-[#4ADE80]">
          Decision engine
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-1 max-h-[380px] space-y-4">
        {recommendations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-[var(--text-muted)]">
            No recommendations generated.
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <motion.div
              key={rec.id || idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`rounded-2xl border p-5 shadow-xs ${getPriorityStyle(rec.priority)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold tracking-wide text-[var(--text-primary)]">{rec.recommendation}</p>
                <span className="text-[9px] uppercase tracking-widest font-extrabold">
                  {rec.priority}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                {rec.reason}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationPanel;
