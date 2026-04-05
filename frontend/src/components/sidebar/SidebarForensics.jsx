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
    { id: 'verified', label: 'Validated Intel', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'flagged', label: 'Flagged Anomaly', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'severe', label: 'Severe Risk', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const triggerCurationForm = (pId) => {
    if (pId === 'verified') {
        handleCurate('verified');
        return;
    }
    // For anomalies and risk, show the investigation form
    const defaultSev = pId === 'severe' ? 'Critical' : 'Medium';
    setFlagData({ ...flagData, severity: defaultSev });
    setShowFlagForm(true);
    setStatus(pId); 
  };

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
          <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Forensic Curation</h4>
          <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest leading-none">Intelligence Signals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {protocols.map((p) => (
          <button
            key={p.id}
            disabled={isLoading}
            onClick={() => triggerCurationForm(p.id)}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${
              status === p.id 
                ? `${p.bg.replace('/10', '/30')} border-white/20 ripple-vidzai shadow-${p.id === 'severe' ? 'red' : p.id === 'flagged' ? 'amber' : 'emerald'}-500/20` 
                : `${p.bg} border-white/5 hover:border-white/10`
            }`}
          >
            <div className="flex items-center gap-4">
              <p.icon className={`${p.color} ${status === p.id ? 'scale-110' : ''} transition-transform`} size={16} />
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                status === p.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {p.label}
              </span>
            </div>
            {status === p.id && (
              <motion.div 
                layoutId="curation-active"
                className={`size-2 rounded-full ${p.id === 'severe' ? 'bg-red-500' : p.id === 'flagged' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
              />
            )}
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
              <h5 className="text-[9px] font-black uppercase text-amber-500 tracking-widest">
                {status === 'severe' ? 'Severe Risk' : 'Anomaly'} Parameters
              </h5>
              <X size={12} className="text-slate-500 cursor-pointer" onClick={() => setShowFlagForm(false)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[7px] uppercase font-black text-slate-600 block px-1">Severity</label>
                <select
                  value={flagData.severity}
                  onChange={(e) => setFlagData({ ...flagData, severity: e.target.value })}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-2.5 text-[9px] font-bold text-white focus:outline-none focus:border-primary transition-all"
                >
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[7px] uppercase font-black text-slate-600 block px-1">Category</label>
                <select
                  value={flagData.category}
                  onChange={(e) => setFlagData({ ...flagData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-2.5 text-[9px] font-bold text-white focus:outline-none focus:border-primary transition-all"
                >
                  <option>Insider Signal</option><option>Off-balance Sheet</option><option>Communication Spike</option><option>Policy Violation</option>
                </select>
              </div>
            </div>
            <textarea
              placeholder="Enter investigative notes for the intelligence alert..."
              value={flagData.note}
              onChange={(e) => setFlagData({ ...flagData, note: e.target.value })}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-[9px] font-mono text-slate-300 h-24 focus:outline-none focus:border-primary resize-none placeholder:text-slate-700"
            />
            <button
              onClick={() => handleCurate(status)}
              className={`w-full py-4 ${status === 'severe' ? 'bg-red-500' : 'bg-amber-500'} text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 transition-all font-sans shadow-lg`}
            >
              COMMIT INTELLIGENCE SIGNAL
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-4 space-y-4">
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
