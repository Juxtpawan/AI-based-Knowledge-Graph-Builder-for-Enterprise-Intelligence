import React from 'react';

/**
 * StatusIndicator - Unified Pulse Indicator
 * Shows live status (Active Context, Researching, Online).
 */
export default function StatusIndicator({ 
    label, 
    status = "active", // 'active', 'thinking', 'offline', 'error'
    className = "" 
}) {
    const variants = {
        active: { dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
        thinking: { dot: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse", text: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
        offline: { dot: "bg-slate-600", text: "text-slate-600", bg: "bg-slate-900 border-white/5" },
        error: { dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]", text: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }
    };

    const config = variants[status];

    return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${config.bg} ${className}`}>
             <div className={`size-1.5 rounded-full ${config.dot}`} />
             <span className={config.text}>{label}</span>
        </div>
    );
}
