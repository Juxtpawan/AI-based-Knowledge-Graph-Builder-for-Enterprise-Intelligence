import React, { useState } from 'react';
import { 
  X, Filter, Search, ShieldCheck, AlertCircle, Calendar, 
  BarChart, Activity, Globe, Scale, Users, Layers, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * IntelligenceFilterPanel - High-Fidelity Forensic Filtering
 * Restored with advanced metabolic and structural forensic categories.
 */
export default function IntelligenceFilterPanel({ 
  isOpen, onClose, activeFilters, setActiveFilters, applyFilters 
}) {
  const sections = [
    {
      id: 'structural',
      label: 'Structural Intelligence',
      icon: Globe,
      options: ['Executive', 'Legal', 'Operations', 'Finance', 'Logistics']
    },
    {
      id: 'metabolic',
      label: 'Metabolic Activity',
      icon: Activity,
      options: ['Spike', 'Steady', 'Dormant', 'Oscillating']
    },
    {
      id: 'forensics',
      label: 'Forensic Triage',
      icon: ShieldCheck,
      options: ['Verified', 'Anomaly', 'Flagged', 'Clean']
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-0 sm:left-0 w-[calc(100vw-2rem)] max-w-[380px] z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="vidzai-glass rounded-3xl sm:rounded-4xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-900/80 backdrop-blur-3xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
           <div className="flex items-center gap-4">
              <div className="p-2.5 bg-vidzai-emerald/10 rounded-2xl">
                 <Filter className="text-vidzai-emerald" size={20} />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Fabric Filter</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Refine Forensic Visualization</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
              <X size={18} />
           </button>
        </div>

        {/* Filter Scrollable Content */}
        <div className="p-6 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
           {sections.map((section) => (
             <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-3">
                   <section.icon size={14} className="text-slate-600" />
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{section.label}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                   {section.options.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                           const current = activeFilters.entityTypes || [];
                           const updated = current.includes(option) 
                             ? current.filter(o => o !== option) 
                             : [...current, option];
                           setActiveFilters({ ...activeFilters, entityTypes: updated });
                        }}
                        className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                          (activeFilters.entityTypes || []).includes(option)
                          ? 'bg-vidzai-emerald text-white border-vidzai-emerald shadow-lg shadow-vidzai-emerald/20'
                          : 'bg-slate-800/40 text-slate-500 border-white/5 hover:border-white/20'
                        }`}
                      >
                         {option}
                      </button>
                   ))}
                </div>
             </div>
           ))}

           {/* Volume Threshold Slider */}
           <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Layers size={14} className="text-slate-600" />
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Volume</h4>
                </div>
                <span className="text-[10px] font-mono text-vidzai-emerald font-bold">{activeFilters.minVolume || 0} Events</span>
              </div>
              <input 
                type="range" 
                min="0" max="1000" step="50"
                value={activeFilters.minVolume || 0}
                onChange={(e) => setActiveFilters({ ...activeFilters, minVolume: Number(e.target.value) })}
                className="w-full accent-vidzai-emerald h-1 rounded-full bg-slate-800"
              />
           </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-slate-950/60 border-t border-white/5 flex gap-4">
           <button 
              onClick={() => setActiveFilters({})}
              className="px-6 py-4 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white hover:bg-slate-900 transition-all"
           >
              Reset
           </button>
           <button 
              onClick={() => { applyFilters(); onClose(); }}
              className="flex-1 py-4 bg-vidzai-emerald text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-vidzai-emerald/20 border border-vidzai-emerald hover:scale-[1.02] active:scale-[0.98] transition-all"
           >
              Apply Analytics
           </button>
        </div>
      </motion.div>
    </div>
  );
}
