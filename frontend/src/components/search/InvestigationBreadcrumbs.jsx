import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * InvestigationBreadcrumbs - Traversal History Tracker
 * Shows the user's path through semantic and structural entities.
 */
export default function InvestigationBreadcrumbs({ path, onSelectStep }) {
    if (path.length === 0) {
        return (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                <div className="size-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">Tracing Engine Cold (Waiting for Probe)</span>
            </div>
        );
    }

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
                {path.map((step, i) => (
                    <React.Fragment key={`${step.id}-${i}`}>
                        <button 
                            onClick={() => onSelectStep({ id: step.id, name: step.name })}
                            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === path.length - 1 ? 'text-vidzai-emerald' : 'text-slate-400 hover:text-white'}`}
                        >
                            {step.name}
                        </button>
                        {i < path.length - 1 && <ChevronRight size={10} className="text-slate-700" />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
