import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database, CheckCircle2, Loader2, BarChart3 } from 'lucide-react';

export default function ProcessingStatus({ 
    total = 0, 
    processed = 0, 
    percentage = 0, 
    loading = false,
    isLive = false
}) {
  if (loading) return null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-full flex flex-col justify-between overflow-hidden relative group">

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Ingestion Engine Info</h3>
             <AnimatePresence>
                {isLive ? (
                   <motion.span 
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.5 }}
                     className="bg-vidzai-emerald/20 text-vidzai-emerald px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 border border-vidzai-emerald/20"
                   >
                     <span className="size-1 rounded-full bg-vidzai-emerald animate-ping" />
                     Live
                   </motion.span>
                ) : (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-white/5"
                    >
                      <Loader2 size={8} className="animate-spin" />
                      Syncing
                    </motion.span>
                )}
             </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="text-right">
                <p className="text-[11px] font-mono text-slate-400 leading-none">{processed.toLocaleString()}</p>
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Records</p>
            </div>
            <div className={`p-2 rounded-xl ${percentage === 100 ? 'bg-vidzai-emerald/10 text-vidzai-emerald' : 'bg-slate-800 text-slate-400'}`}>
               <CheckCircle2 size={16} />
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar Container */}
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-vidzai-emerald">{percentage}%</span>
                <span className="text-[10px] font-mono text-slate-500">{total.toLocaleString()} Max</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-linear-to-r from-vidzai-emerald/40 to-vidzai-emerald relative"
                >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/20 blur-sm" />
                </motion.div>
            </div>
        </div>

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 hover:border-vidzai-emerald/20 transition-colors group/card">
               <div className="flex items-center gap-2 mb-1">
                  <Database size={12} className="text-slate-500 group-hover/card:text-vidzai-emerald transition-colors" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repository</span>
               </div>
               <p className="text-[10px] font-mono text-slate-300">NEO4J CLOUD</p>
            </div>
            <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 hover:border-vidzai-emerald/20 transition-colors group/card">
               <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={12} className="text-slate-500 group-hover/card:text-vidzai-emerald transition-colors" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Throughput</span>
               </div>
               <p className="text-[10px] font-mono text-slate-300">AUTO-SCALED</p>
            </div>
        </div>
      </div>
    </div>
  );
}
