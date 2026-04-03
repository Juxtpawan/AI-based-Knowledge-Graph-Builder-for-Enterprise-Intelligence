import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BloomGraphCanvas from '../graph/BloomGraphCanvas';
import SidebarNodeInfo from '../sidebar/SidebarNodeInfo';

/**
 * IntelligenceSidebar - Dual-mode Inspection Panel
 * Toggles between structural Graph and high-density Probe modes.
 */
export default function IntelligenceSidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  messages,
  selectedElement,
  setSelectedElement,
  expandNode
}) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed inset-y-4 right-4 xl:relative xl:inset-auto w-[calc(100%-2rem)] max-w-[400px] flex flex-col glass-panel-heavy rounded-4xl shadow-2xl z-50 overflow-hidden bg-slate-900/60"
        >
          {/* Sidebar Navigation */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('graph')}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${activeTab === 'graph' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Network size={16} className={activeTab === 'graph' ? 'glow-blue' : ''} /> Graph
              </button>
              <div className="w-px h-3 bg-white/10" />
              <button
                onClick={() => setActiveTab('probe')}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${activeTab === 'probe' ? 'text-vidzai-emerald' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Info size={16} className={activeTab === 'probe' ? 'glow-emerald' : ''} /> Probe
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="xl:hidden p-1.5 hover:bg-white/5 rounded-lg text-slate-500">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Viewport Core */}
          <div className="flex-1 relative bg-slate-950/20 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'graph' ? (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0"
                >
                  {messages.filter(m => m.role === 'agent' && m.graph).length > 0 ? (
                    <BloomGraphCanvas
                      graphData={(() => {
                        const lastAgentMsg = [...messages].reverse().find(m => m.role === 'agent' && m.graph);
                        return lastAgentMsg?.graph;
                      })()}
                      onNodeClick={setSelectedElement}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center group">
                      <div className="p-8 glass-panel border-dashed rounded-3xl border-slate-800 hover:border-primary/40 transition-all cursor-default w-full">
                        <Network size={40} className="text-slate-800 mx-auto mb-6 group-hover:text-primary transition-colors group-hover:scale-110 duration-500" />
                        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em] leading-loose">Neural Link Idle<br />System Awaiting Prompt</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="probe"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <SidebarNodeInfo
                    element={selectedElement}
                    onExpand={(node) => expandNode(node.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
