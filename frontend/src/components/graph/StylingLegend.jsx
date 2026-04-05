import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, Info } from 'lucide-react';

/**
 * StylingLegend - Forensic Entity Legend (Restored to Canonical Backend Labels)
 */
export default function StylingLegend({ isOpen, onClose, viewMode = 'global' }) {
    const globalLegends = [
        { label: 'Employee', color: 'bg-[#6366f1]', glow: 'shadow-[#6366f1]/40', desc: 'Enterprise Identity / Personnel' },
        { label: 'Email', color: 'bg-[#f59e0b]', glow: 'shadow-[#f59e0b]/40', desc: 'Communication Archive' },
        { label: 'Legal', color: 'bg-[#ef4444]', glow: 'shadow-[#ef4444]/40', desc: 'Regulatory & Corporate Compliance' },
        { label: 'Event', color: 'bg-[#10b981]', glow: 'shadow-[#10b981]/40', desc: 'Temporal Milestone / Incident' },
        { label: 'Topic', color: 'bg-[#14b8a6]', glow: 'shadow-[#14b8a6]/40', desc: 'Semantic Intelligence Cluster' },
        { label: 'Entity', color: 'bg-[#0ea5e9]', glow: 'shadow-[#0ea5e9]/40', desc: 'Categorical Node' }
    ];

    const legends = globalLegends;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-10 right-0 w-[calc(100vw-2rem)] max-w-[288px] vidzai-glass-frame p-5 sm:p-6 shadow-2xl z-50 border-white/10 bg-slate-900/95 backdrop-blur-3xl rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-vidzai-emerald" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                                Styling Legends
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {legends.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 group cursor-default">
                                <div className={`size-3 rounded-full mt-1 ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.5)] ${item.glow} group-hover:scale-125 transition-transform`} />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest leading-none">{item.label}</span>
                                    <span className="text-[9px] text-slate-500 font-medium leading-tight">{item.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
