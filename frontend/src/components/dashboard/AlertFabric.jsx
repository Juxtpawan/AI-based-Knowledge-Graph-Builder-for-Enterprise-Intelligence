import React from 'react';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AlertFabric — Live intelligence alert feed for the Overview dashboard.
 *
 * Displays flagged nodes and relationships from the Neo4j curation system.
 * Each entry shows severity (critical/warning), title, category, and time.
 *
 * Props:
 *  - alerts   (array) — [{id, type, title, description, time}]
 *  - loading  (bool)  — shows skeleton rows when true
 */
export default function AlertFabric({ alerts = [], loading = false }) {
  const severityConfig = {
    critical: {
      dot: 'bg-red-500',
      glow: 'shadow-red-500/30',
      border: 'hover:border-red-500/20',
      badge: 'text-red-400 bg-red-500/10',
    },
    warning: {
      dot: 'bg-amber-500',
      glow: 'shadow-amber-500/30',
      border: 'hover:border-amber-500/20',
      badge: 'text-amber-400 bg-amber-500/10',
    },
    info: {
      dot: 'bg-emerald-500',
      glow: 'shadow-emerald-500/30',
      border: 'hover:border-emerald-500/20',
      badge: 'text-emerald-400 bg-emerald-500/10',
    },
  };

  return (
    <div className="vidzai-glass p-5 sm:p-8 rounded-4xl border border-white/5 flex flex-col bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-2xl">
          <ShieldAlert className="text-amber-500" size={20} />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest leading-none">
            Intelligence Alerts
          </h3>
          <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">
            {loading ? 'Syncing...' : `${alerts.length} active signal${alerts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Alert list - Fixed height for scrollable section */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar mt-6 h-[420px]">
        {loading ? (
          // Shimmer skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-3xl animate-pulse" />
          ))
        ) : alerts.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-2xl">
              <AlertTriangle size={20} className="text-slate-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              No active alerts
            </p>
            <p className="text-[9px] text-slate-700 uppercase tracking-wider">
              Flag nodes in Graph Studio to create signals
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, idx) => {
              const cfg = severityConfig[alert.type] || severityConfig.info;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group p-4 bg-slate-950/40 hover:bg-slate-900/60 transition-all rounded-3xl border border-white/5 ${cfg.border} cursor-pointer overflow-hidden relative shadow-lg ${cfg.glow}`}
                >

                  {/* Title row */}
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`size-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {alert.type}
                    </span>
                    <span className="text-[9px] font-mono text-slate-700 ml-auto">{alert.time}</span>
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight mb-1 pr-8 truncate">
                    {alert.title}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter pr-8 line-clamp-1">
                    {alert.description}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
