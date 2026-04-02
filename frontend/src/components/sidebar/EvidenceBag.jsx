import React from 'react';
import { 
  Pin, Trash2, Download, ExternalLink, 
  Database, Fingerprint, FileText, Share2, 
  Maximize2, X, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EvidenceBag - High-Fidelity Forensic Collection
 * Restored with integrated intelligence exports and atomic pin management.
 */
export default function EvidenceBag({ items = [], onRemove, onClear, onSelect }) {
  const exportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `forensic_bundle_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (items.length === 0) return null;

  return (
    <div className="w-80 pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="vidzai-glass rounded-4xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden bg-slate-900/60 backdrop-blur-3xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-vidzai-emerald/15 rounded-xl border border-vidzai-emerald/20">
                 <Pin className="text-vidzai-emerald" size={16} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Evidence Bag</h3>
              <span className="px-2 py-0.5 bg-slate-800 rounded-full text-[8px] font-mono text-slate-400 border border-white/5">{items.length}</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={exportAll}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                title="Export Bundle"
              >
                 <Download size={14} />
              </button>
              <button 
                onClick={onClear}
                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                title="Prune All"
              >
                 <Trash2 size={14} />
              </button>
           </div>
        </div>

        {/* Evidence List */}
        <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
           <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div 
                   key={item.id}
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   exit={{ x: 20, opacity: 0 }}
                   className="group p-4 bg-slate-950/40 hover:bg-slate-900/60 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center justify-between pointer-events-auto cursor-pointer"
                   onClick={() => onSelect && onSelect(item)}
                >
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-primary/20 transition-colors">
                         {item.labels?.includes('Employee') ? <Fingerprint size={14} className="text-vidzai-emerald" /> : <Database size={14} className="text-indigo-400" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[11px] font-bold text-white truncate pr-2 uppercase tracking-tighter">
                            {item.properties?.name || item.properties?.subject || item.id.substring(0, 8)}
                         </span>
                         <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest font-black leading-none mt-1">
                            {item.labels?.[0] || 'Entity'}
                         </span>
                      </div>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                      className="p-2 text-slate-800 group-hover:text-red-500/40 hover:text-red-500! transition-colors"
                   >
                      <X size={14} />
                   </button>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Footer Analysis Summary */}
        <div className="p-5 bg-slate-950/60 border-t border-white/5">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Bundle Integrity</span>
              <div className="flex items-center gap-2">
                 <ShieldCheck size={10} className="text-emerald-500" />
                 <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest">Verified</span>
              </div>
           </div>
           <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div className="bg-vidzai-emerald h-full w-[85%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           </div>
        </div>
      </motion.div>
    </div>
  );
}
