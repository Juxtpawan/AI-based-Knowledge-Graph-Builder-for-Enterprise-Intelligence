import React from 'react';
import { motion } from 'framer-motion';

/**
 * KpiCard — Reusable KPI metric card for the Overview dashboard.
 *
 * Props:
 *  - label    (string)   — e.g. "Intelligence Links"
 *  - value    (string)   — e.g. "14,203"
 *  - icon     (Component) — Lucide icon component
 *  - color    (string)   — Tailwind text color class, e.g. "text-emerald-500"
 *  - bg       (string)   — Tailwind bg color class, e.g. "bg-emerald-500/10"
 *  - sublabel (string)   — Optional formula/source label shown at bottom
 *  - loading  (bool)     — Shows shimmer skeleton when true
 *  - index    (number)   — Used for staggered animation delay
 */
export default function KpiCard({ label, value, icon: Icon, color, bg, sublabel, loading = false, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      className="vidzai-glass p-4 sm:p-6 rounded-3xl border border-white/5 relative overflow-hidden group shadow-2xl"
    >
      {/* Hover glow backdrop */}
      <div className={`absolute -right-4 -bottom-4 p-8 ${bg} blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          {Icon && <Icon size={18} className={color} />}
        </div>
        <span className="text-[10px] font-mono text-slate-600 font-bold tracking-widest uppercase flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${loading ? 'bg-slate-700' : 'bg-emerald-500'} ${loading ? '' : 'animate-pulse'}`} />
          Live
        </span>
      </div>

      {/* Label */}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-28 bg-slate-800 animate-pulse rounded-lg mt-1" />
      ) : (
        <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
      )}

      {/* Formula sublabel */}
      {sublabel && !loading && (
        <p className="text-[9px] font-mono text-slate-700 mt-2 tracking-widest uppercase leading-tight">
          {sublabel}
        </p>
      )}
    </motion.div>
  );
}
