import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, BarChart3, Database, Fingerprint, ShieldCheck } from 'lucide-react';

const IntelligenceSidebar = ({ isOpen, onClose, activeTab, setActiveTab, selectedElement }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-96 bg-slate-900/60 backdrop-blur-3xl border-l border-white/5 flex flex-col h-full relative z-20"
    >
      {/* Header Tabs */}
      <div className="p-6 border-b border-white/5 bg-slate-900/40 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">Intelligence Stack</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          {['graph', 'probe'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab} Registry
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {activeTab === 'probe' && selectedElement ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Probe</p>
                <h4 className="text-lg font-bold text-white tracking-tight">{selectedElement.properties?.name || 'Unknown Entity'}</h4>
              </div>
            </div>
            
            <div className="space-y-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                     <Database className="w-3 h-3 text-slate-500" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cross-Registry Map</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                     Entity detected in {selectedElement.properties?.count || 12} communication clusters. 
                     Reliability score is <span className="text-emerald-400">98.2%</span>.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
             <Globe className="w-12 h-12 text-slate-600" />
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">
                Waiting for active <br /> graph selection...
             </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Sync Active</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             animate={{ x: [-100, 300] }} 
             transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
             className="w-20 h-full bg-indigo-500/30 blur-sm" 
           />
        </div>
      </div>
    </motion.div>
  );
};

export default IntelligenceSidebar;
