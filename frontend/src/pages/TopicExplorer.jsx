import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Network, BrainCircuit, X, Database, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BloomGraphCanvas from '../components/BloomGraphCanvas';
import SidebarNodeInfo from '../components/SidebarNodeInfo';
import { kgService } from '../services/apiClient';
import EvidenceBag from '../components/EvidenceBag';
import { useIntelStore } from '../store/useIntelStore';

export default function TopicExplorer() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedGraphElement, setSelectedGraphElement] = useState(null);
  const { investigationPath, addToPath, clearInvestigation } = useIntelStore();

  // Handle URL Search Params (from Command Palette)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const id = params.get('id');
    if (q && id) {
      handleSelectTopic({ name: q, id: id, label: 'CONCEPT' });
    }
  }, [location.search]);

  // Debounced Search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await kgService.getSuggestions(searchQuery);
        setSuggestions(res.suggestions || []);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setSearchQuery(topic.name);
    setSuggestions([]);
    addToPath({ id: topic.id, name: topic.name, type: 'topic' });
  };

  const clearTopic = () => {
    clearInvestigation();
    setSearchQuery('');
  };

  return (
    <div className="flex h-full w-full bg-slate-950 relative overflow-hidden font-sans">
      
      {/* 1. LEFT SEARCH SIDEBAR (Responsive & Glace) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative left-0 top-0 lg:top-auto h-full w-80 vidzai-glass-frame border-r border-white/5 flex flex-col z-45"
          >
            <div className="p-8 border-b border-white/5 bg-slate-950/20">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <BrainCircuit className="text-indigo-400" size={24} />
                     </div>
                     <div>
                        <h2 className="font-bold text-white tracking-tight text-lg font-display">Topics</h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] font-bold">Trace Core</p>
                     </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-800 rounded-full text-slate-500">
                     <ChevronLeft size={20} />
                  </button>
               </div>

               {/* Omni-Search Input */}
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                 </div>
                 <input
                    type="text"
                    placeholder="Search events, concepts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xl"
                 />
                 {searchQuery && (
                   <button 
                     onClick={clearTopic}
                     className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-white"
                   >
                     <X size={16} />
                   </button>
                 )}
               </div>

               {/* Autocomplete Dropdown */}
               <AnimatePresence>
                 {suggestions.length > 0 && !selectedTopic && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-6 right-6 mt-4 glass-panel-heavy rounded-2xl shadow-2xl overflow-hidden z-[50]"
                   >
                     {suggestions.map((s, i) => (
                       <button 
                         key={i} 
                         onClick={() => handleSelectTopic(s)}
                         className="w-full text-left px-5 py-4 hover:bg-indigo-500/10 border-b border-white/5 last:border-0 transition-all flex flex-col group"
                       >
                         <span className="font-semibold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors">{s.name}</span>
                         <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest mt-1.5 opacity-70">{s.label}</span>
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Selected Topic Meta */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
               {selectedTopic ? (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div className="p-6 bg-vidzai-emerald/5 border border-vidzai-emerald/20 rounded-4xl relative overflow-hidden group shadow-2xl shadow-vidzai-emerald/5">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                        <Database size={64} className="text-vidzai-emerald" />
                     </div>
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Focus Cluster</h3>
                     <h4 className="text-2xl font-bold text-white wrap-break-word relative z-10 leading-tight">{selectedTopic.name}</h4>
                     <p className="text-[10px] text-indigo-400 font-mono mt-4 uppercase tracking-[0.2em] border border-indigo-500/30 inline-block px-3 py-1.5 rounded-xl bg-indigo-500/10 relative z-10 font-bold">Semantic_Node</p>
                   </div>
                   
                   <div className="space-y-4">
                      <p className="text-[15px] text-slate-400 leading-relaxed font-medium">
                        Tracing <span className="text-indigo-300">Semantic Nodes</span>. The graph engine isolates all emails mentioning this concept, mapping structural links to employees.
                      </p>
                      
                      <div className="p-5 vidzai-glass-frame rounded-2xl border-dashed bg-slate-900/10">
                        <p className="text-[11px] text-slate-500 text-center font-mono uppercase tracking-[0.2em] leading-loose">
                          Interactive Mode: Active<br/>
                          <span className="opacity-50">Click nodes to inspect metadata</span>
                        </p>
                      </div>
                   </div>
                 </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6 opacity-40">
                   <Network size={48} className="text-slate-700" />
                   <p className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-center px-4 leading-loose">Initialize search <br/> to trace semantic influence</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN GRAPH CANVAS */}
      <div className="flex-1 relative bg-slate-950">
        
        {/* BREADCRUMBS BAR */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
           {investigationPath.length === 0 ? (
              <div className="flex items-center gap-3">
                 <div className="size-1.5 bg-indigo-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">Tracing Engine Cold (Waiting for Probe)</span>
              </div>
           ) : (
              <div className="flex items-center gap-3">
                 {investigationPath.map((step, i) => (
                    <React.Fragment key={step.id + i}>
                       <button 
                          onClick={() => handleSelectTopic({ id: step.id, name: step.name })}
                          className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === investigationPath.length - 1 ? 'text-vidzai-emerald' : 'text-slate-400 hover:text-white'}`}
                       >
                          {step.name}
                       </button>
                       {i < investigationPath.length - 1 && <ChevronRight size={10} className="text-slate-700" />}
                    </React.Fragment>
                 ))}
              </div>
           )}
        </div>

        <BloomGraphCanvas 
            searchPhrase={selectedTopic?.name || ''}
            onNodeClick={(node) => {
                setSelectedGraphElement(node);
                if (node) {
                    addToPath({ 
                        id: node.id, 
                        name: node.properties?.name || node.properties?.subject || node.id, 
                        type: 'node' 
                    });
                }
            }}
        />

        <EvidenceBag />
        
        {/* Toggle Button for Left Sidebar */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-6 top-6 size-12 glass-panel rounded-full flex items-center justify-center text-indigo-400 shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* 3. RIGHT PROPERTIES PANEL */}
      <AnimatePresence>
        {selectedGraphElement && (
          <motion.div 
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="fixed lg:relative right-0 top-0 h-full w-80 glass-panel-heavy border-l border-white/5 flex flex-col z-45 shadow-[-20px_0_40px_rgba(0,0,0,0.4)]"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
               <div className="flex items-center gap-3">
                  <Info size={16} className="text-amber-500" />
                  <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Intelligence Inspector</h3>
               </div>
               <button onClick={() => setSelectedGraphElement(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                 <X size={18} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <SidebarNodeInfo element={selectedGraphElement} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
