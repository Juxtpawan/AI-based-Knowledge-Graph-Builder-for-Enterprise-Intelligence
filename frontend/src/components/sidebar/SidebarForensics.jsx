import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, SearchSlash, CheckCircle2, AlertTriangle, Scale, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { kgService } from '../../services/apiClient';

/**
 * SidebarForensics - Curation Triage Engine (Functional & High-Fidelity)
 * Loss-less modularization integrating real-time curation protocols.
 */
export default function SidebarForensics({ element }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(element?.properties?.curation_status || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagData, setFlagData] = useState({
    severity: 'Medium',
    category: 'Communication Spike',
    note: ''
  });

  if (!element) return null;
  const isNode = !element.isRelationship;

  const handleCurate = async (newStatus) => {
    setIsLoading(true);
    try {
      await kgService.curateElement({
        element_id: element.id,
        is_node: isNode,
        status: newStatus,
        severity: newStatus === 'flagged' ? flagData.severity : 'Low',
        category: newStatus === 'flagged' ? flagData.category : 'None',
        note: newStatus === 'flagged' ? flagData.note : ''
      });
      setStatus(newStatus);
      setShowFlagForm(false);
    } catch (err) {
      console.error("Curation protocol failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrune = async () => {
    if (!window.confirm("FATAL ACTION: Permanently prune this intelligence from the graph?")) return;
    setIsLoading(true);
    try {
      await kgService.pruneElement(element.id, isNode);
      navigate(0); 
    } catch (err) {
      console.error("Pruning process interrupted:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const protocols = [
    { id: 'verified', label: 'Validated Intel', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'flagged', label: 'Flagged Anomaly', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'severe', label: 'Severe Risk', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
         <div className="p-2.5 bg-vidzai-emerald/10 rounded-2xl border border-vidzai-emerald/20">
            <Fingerprint className="text-vidzai-emerald" size={18} />
         </div>
         <div>
            <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Forensic Triage</h4>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest leading-none">Human-in-the-Loop Audit Protocol</p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
         {protocols.map((p) => (
            <button 
                key={p.id} 
                disabled={isLoading}
                onClick={() => p.id === 'flagged' ? setShowFlagForm(!showFlagForm) : handleCurate(p.id)}
                className={`group flex items-center justify-between p-4 ${p.bg} rounded-2xl border ${status === p.id ? 'border-primary' : 'border-white/5'} hover:border-white/10 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/20`}
            >
               <div className="flex items-center gap-4">
                  <p.icon className={p.color} size={16} />
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.15em] group-hover:text-white">
                    {p.label} {status === p.id && <span className="ml-2 text-[8px] text-primary">●</span>}
                  </span>
               </div>
               <div className={`size-4 rounded-full border-2 ${status === p.id ? 'border-primary bg-primary/20' : 'border-white/5'} group-hover:border-primary/50 transition-colors`} />
            </button>
         ))}
      </div>

      <AnimatePresence>
        {showFlagForm && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="vidzai-glass p-6 rounded-3xl space-y-4 border-amber-500/20 bg-slate-900/60 backdrop-blur-3xl overflow-hidden"
            >
                <div className="flex items-center justify-between">
                    <h5 className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Anomaly Parameters</h5>
                    <X size={12} className="text-slate-500 cursor-pointer" onClick={() => setShowFlagForm(false)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[7px] uppercase font-black text-slate-600 block px-1">Severity</label>
                        <select 
                            value={flagData.severity}
                            onChange={(e) => setFlagData({...flagData, severity: e.target.value})}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl p-2.5 text-[9px] font-bold text-white focus:outline-none focus:border-primary transition-all"
                        >
                            <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[7px] uppercase font-black text-slate-600 block px-1">Category</label>
                        <select 
                            value={flagData.category}
                            onChange={(e) => setFlagData({...flagData, category: e.target.value})}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl p-2.5 text-[9px] font-bold text-white focus:outline-none focus:border-primary transition-all"
                        >
                            <option>Off-balance Sheet</option><option>Communication Spike</option><option>Insider Signal</option><option>Policy Violation</option>
                        </select>
                    </div>
                </div>
                <textarea 
                    placeholder="Enter forensic investigation notes..."
                    value={flagData.note}
                    onChange={(e) => setFlagData({...flagData, note: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-[9px] font-mono text-slate-300 h-24 focus:outline-none focus:border-primary resize-none placeholder:text-slate-700"
                />
                <button 
                    onClick={() => handleCurate('flagged')}
                    className="w-full py-4 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-400 transition-all font-sans shadow-lg shadow-amber-500/20"
                >
                    COMMIT TO AUDIT LOG
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-4 space-y-4">
         <div className="p-5 bg-slate-900/40 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                   <Scale size={12} /> Probabilistic Weight
                </span>
                <span className="text-[10px] font-mono text-primary font-black">0.865</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full w-[86%] bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
            </div>
         </div>

         <button 
            onClick={handlePrune}
            disabled={isLoading}
            className="w-full group flex items-center justify-center gap-3 py-4 rounded-3xl bg-slate-950 border border-red-500/10 text-red-500/40 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500/5 hover:border-red-500 hover:text-red-500 transition-all duration-500 font-sans"
         >
            <SearchSlash size={14} className="group-hover:rotate-12 transition-transform" /> 
            {isLoading ? 'EXECUTING...' : 'PRUNE FROM GRAPH'}
         </button>
      </div>

    </motion.div>
  );
}
