import React, { useState } from 'react';
import {
  X, Activity, Fingerprint, Download,
  Pin, ChevronRight, Share2, Info
} from 'lucide-react';


import { motion, AnimatePresence } from 'framer-motion';
import { useIntelStore } from '../../store/useIntelStore';

// Atomic Forensic Modules
import SidebarMetadata from './SidebarMetadata';
import SidebarAnalytics from './SidebarAnalytics';
import SidebarForensics from './SidebarForensics';
import NodeIdentity from './NodeIdentity';

/**
 * SidebarNodeInfo - High-Fidelity Forensic Orchestrator
 * Curated with Lossless Modularization for enterprise scalability.
 */
export default function SidebarNodeInfo({ element, onClose, onExpand }) {
  const { pinNode, unpinNode, evidenceBag } = useIntelStore();
  const [activeTab, setActiveTab] = useState(element?.initialTab || 'metadata'); // 'metadata', 'analytics', 'forensics'

  if (!element) return null;

  const isPinned = evidenceBag.some(item => item.id === element.id);

  const tabs = [
    { id: 'metadata', label: 'Inspect', icon: Info },
    { id: 'analytics', label: 'Metrics', icon: Activity },
    { id: 'forensics', label: 'Curation', icon: Fingerprint }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/80 backdrop-blur-3xl overflow-hidden font-sans relative">

      {/* 1. ENTITY HEADER */}
      <div className="p-4 border-b border-white/5 bg-slate-900/40 relative">
        <div className="flex items-start justify-between">
          <NodeIdentity element={element} />
        </div>

        {/* Action Triage */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => isPinned ? unpinNode(element.id) : pinNode(element)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPinned ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            <Pin size={14} className={isPinned ? 'fill-current' : ''} /> {isPinned ? 'PINNED' : 'COLLECT'}
          </button>
          {!element.isRelationship && (
            <button
              onClick={() => onExpand(element)}
              className="flex items-center justify-center gap-2.5 px-6 py-3 bg-vidzai-emerald text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-xl shadow-vidzai-emerald/20"
            >
              PROBE NEIGHBORS <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. FORENSIC TABS */}
      <div className="flex px-4 py-2 border-b border-white/5 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2 text-[12px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-primary border-primary' : 'text-slate-600 border-transparent hover:text-slate-400'}`}
          >
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {/* 3. SCROLLABLE ANALYTICS DEPOT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'metadata' && (
            <motion.div key="meta" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <SidebarMetadata element={element} />
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div key="stats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <SidebarAnalytics element={element} />
            </motion.div>
          )}
          {activeTab === 'forensics' && (
            <motion.div key="cur" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <SidebarForensics element={element} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. EXPORT UTILITIES */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white rounded-2xl transition-all group backdrop-blur-3xl shadow-3xl">
            <Share2 size={14} className="group-hover:scale-110 transition-transform" /> Share Intel
          </button>
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-primary rounded-2xl transition-all group backdrop-blur-3xl shadow-3xl">
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Export JSON
          </button>
        </div>
      </div>

    </div>
  );
}
