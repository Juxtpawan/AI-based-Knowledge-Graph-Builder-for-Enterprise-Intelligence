import React from 'react';
import { X, Search, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NodeIdentity from './NodeIdentity';
import SidebarMetadata from './SidebarMetadata';
import SidebarAnalytics from './SidebarAnalytics';
import SidebarForensics from './SidebarForensics';

const SidebarNodeInfo = ({ node, onClose, onAction }) => {
  if (!node) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-6 top-6 bottom-6 w-[400px] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden"
    >
      {/* Header Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all bg-slate-900/50 border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <NodeIdentity node={node} />
        
        <div className="px-6 py-4 flex gap-4 border-b border-white/5 bg-white/5 overflow-x-auto no-scrollbar">
          {['Details', 'Flux', 'Forensics', 'Graph'].map((tab, i) => (
            <button
              key={tab}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                ${i === 0 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <SidebarAnalytics analytics={node.properties?.analytics} />
        <SidebarForensics node={node} onAction={onAction} />
        <SidebarMetadata properties={node.properties} />
        
        {/* Footer info */}
        <div className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-20">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Forensic Scan Verified</span>
          </div>
          <p className="text-[10px] text-slate-600 font-medium tracking-tight">
            Node synchronized with organization-wide intelligence ledger at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarNodeInfo;
