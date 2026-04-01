import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BloomGraphCanvas from '../components/BloomGraphCanvas';
import SidebarNodeInfo from '../components/SidebarNodeInfo';
import UnifiedChatRail from '../components/UnifiedChatRail';
import { useIntelStore } from '../store/useIntelStore';
import IntelligenceFilterPanel from '../components/IntelligenceFilterPanel';
import {
   Network,
   MessageSquare,
   Info,
   ChevronRight,
   Maximize2,
   X,
   Layers,
   Search,
   Loader,
   Layout,
   Bot,
   Terminal,
   Play,
   RotateCcw,
   AlertCircle,
   History,
   Clock,
   Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';

export default function NetworkView() {
   const location = useLocation();
   const {
      selectedElement,
      setSelectedElement,
      activeSearchPhrase,
      setActiveSearchPhrase,
      isIntelligenceRailOpen,
      setIsIntelligenceRailOpen,
      graphStats,
      setCustomGraphData,
      customGraphData,
      cypherHistory,
      addToCypherHistory
   } = useIntelStore();

   const [cypherQuery, setCypherQuery] = React.useState('MATCH (n) RETURN n LIMIT 25');
   const [loading, setLoading] = React.useState(false);
   const [error, setError] = React.useState(null);
   const [activeTerminalTab, setActiveTerminalTab] = React.useState('editor'); // 'editor' | 'history'
   const [isStylingLegendOpen, setIsStylingLegendOpen] = React.useState(false);
   const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);
   const [activeFilters, setActiveFilters] = React.useState({
      entityTypes: [],
      categories: [],
      years: [],
      timePatterns: [],
      messageLength: [],
      minVolume: 0,
      showOnlyFlagged: false,
      diversity: 'All'
   });

   const applyFilters = async () => {
      let groupClauses = [];

      if (activeFilters.entityTypes.length > 0) {
         groupClauses.push(`n.entity_type IN ${JSON.stringify(activeFilters.entityTypes)}`);
      }
      if (activeFilters.categories.length > 0) {
         groupClauses.push(`n.category IN ${JSON.stringify(activeFilters.categories)}`);
      }
      if (activeFilters.years.length > 0) {
         groupClauses.push(`n.year IN [${activeFilters.years.join(', ')}]`);
      }
      if (activeFilters.timePatterns.length > 0) {
         groupClauses.push(`n.time_category IN ${JSON.stringify(activeFilters.timePatterns)}`);
      }
      if (activeFilters.messageLength.length > 0) {
         const lengthMap = { 'Short': 1, 'Medium': 2, 'Long': 3 };
         const lengths = activeFilters.messageLength.map(l => lengthMap[l]);
         groupClauses.push(`n.email_length IN ${JSON.stringify(lengths)}`);
      }
      if (activeFilters.minVolume > 0) {
         groupClauses.push(`n.sent_count > ${activeFilters.minVolume}`);
      }
      if (activeFilters.showOnlyFlagged) {
         groupClauses.push(`n.curation_status = 'Flagged'`);
      }
      if (activeFilters.diversity !== 'All') {
         const threshold = activeFilters.diversity === 'High' ? 0.6 : 0.3;
         groupClauses.push(`n.diversity_score > ${threshold}`);
      }

      const wherePart = groupClauses.length > 0 ? 'WHERE ' + groupClauses.join(' AND ') : '';
      const generatedQuery = `MATCH (n) ${wherePart} WITH n LIMIT 100 OPTIONAL MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 250`;
      
      setCypherQuery(generatedQuery);
      setLoading(true);
      setError(null);
      try {
         const result = await kgService.runCypher(generatedQuery);
         setCustomGraphData(result);
         addToCypherHistory(generatedQuery);
      } catch (err) {
         setError(err.message || "Filter failed");
      } finally {
         setLoading(false);
         setIsFilterPanelOpen(false);
      }
   };

   // Handle URL Search Params (from Command Palette)
   useEffect(() => {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
         setActiveSearchPhrase(q);
      }
   }, [location.search, setActiveSearchPhrase]);

   return (
      <div className="flex h-full w-full bg-transparent overflow-hidden font-sans">

         {/* 1. CENTER GRAPH WINDOW */}
         <div className="flex-1 p-6 relative flex flex-col overflow-hidden">

            {/* Window Header */}
            <div className="vidzai-glass-frame rounded-t-2xl border-b-0 h-14 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-xl z-20">
               <div className="flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-vidzai-emerald/10 border border-vidzai-emerald/30 flex items-center justify-center text-vidzai-emerald shadow-lg shadow-vidzai-emerald/5">
                     <Network size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                     Knowledge Graph
                  </h3>
               </div>
               <div className="flex items-center gap-4">
                  <div className="hidden lg:flex items-center gap-5 mr-6 border-r border-white/5 pr-6">
                  <div className="flex flex-col items-center cursor-pointer group relative">
                     <Sliders 
                        size={14} 
                        className={`${isFilterPanelOpen ? 'text-vidzai-emerald' : 'text-slate-500'} group-hover:text-vidzai-emerald transition-colors`} 
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                     />
                     <span className="text-[8px] uppercase font-bold text-slate-600 mt-1 select-none">Filters</span>

                     {/* Intelligence Filter Panel Component */}
                     <IntelligenceFilterPanel 
                        isOpen={isFilterPanelOpen}
                        onClose={() => setIsFilterPanelOpen(false)}
                        activeFilters={activeFilters}
                        setActiveFilters={setActiveFilters}
                        applyFilters={applyFilters}
                     />
                  </div>
                     <div
                        className="flex flex-col items-center cursor-pointer group relative"
                        onClick={() => setIsStylingLegendOpen(!isStylingLegendOpen)}
                     >
                        <Layers size={14} className={`${isStylingLegendOpen ? 'text-vidzai-emerald' : 'text-slate-500'} group-hover:text-vidzai-emerald transition-colors`} />
                        <span className="text-[8px] uppercase font-bold text-slate-600 mt-1 select-none">Styling</span>

                        {/* Styling Legend Tooltip */}
                        <AnimatePresence>
                           {isStylingLegendOpen && (
                              <motion.div
                                 initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                 className="absolute top-12 right-0 w-56 vidzai-glass-frame p-5 rounded-2xl z-50 shadow-2xl bg-slate-900/95 backdrop-blur-2xl border-white/10 pointer-events-auto"
                                 onClick={(e) => e.stopPropagation()}
                              >
                                 <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Styling Legend</h4>
                                    <X size={12} className="text-slate-500 hover:text-white cursor-pointer" onClick={() => setIsStylingLegendOpen(false)} />
                                 </div>
                                 <div className="space-y-3.5">
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-vidzai-emerald shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Employee</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Email</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Organization</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Person Entity</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Location</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="size-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Event / Other</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-white/5">
                                       <div className="flex items-center gap-3">
                                          <div className="h-0.5 w-4 bg-[#475569] rounded-full" />
                                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest italic">Relationships</span>
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>
            </div>

            {/* Canvas System */}
            <div className="flex-1 vidzai-glass-frame border-t-0 rounded-b-2xl overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-vidzai-emerald/20 to-transparent" />
               <BloomGraphCanvas
                  searchPhrase={activeSearchPhrase}
                  onNodeClick={setSelectedElement}
               />

               {/* Graph Legend Overlay (Atomic sync) */}
               <div className="absolute top-4 right-4 z-20 vidzai-glass-frame p-2 rounded-xl border-white/5 bg-slate-900/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="space-y-2">
                     <div className="flex items-center gap-2.5">
                        <div className="size-1 bg-vidzai-emerald rounded-full glow-emerald" />
                        <span className="text-[8px] font-mono text-slate-200">Nodes: {graphStats.nodes}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <div className="size-1 bg-indigo-500 rounded-full" />
                        <span className="text-[8px] font-mono text-slate-200">Edges: {graphStats.edges}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* 2. INTELLIGENCE RAIL (Right Stack) */}
         <AnimatePresence>
            {isIntelligenceRailOpen && (
               <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-[420px] h-full flex flex-col pt-6 pr-6 pb-6 z-[45]"
               >
                  <div className="flex-1 vidzai-glass-frame rounded-2xl flex flex-col overflow-hidden bg-slate-900/40">



                     {/* CYPHER QUERY CONSOLE */}
                     <div className="flex flex-col h-[30%]! overflow-hidden bg-slate-950/20">
                        <div className="p-2 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                           <div className="flex items-center w-[50%] pl-0.5 gap-3">
                              <div className="size-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                 <Terminal size={12} />
                              </div>
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Cypher Terminal</h3>
                           </div>
                           <div className="flex items-center w-[50%] justify-end gap-2">
                              {/* Terminal Tabs */}
                              <div className="flex items-center gap-1">
                                 <button
                                    onClick={() => setActiveTerminalTab('editor')}
                                    className={`px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${activeTerminalTab === 'editor' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                                 >
                                    Editor
                                 </button>
                                 <button
                                    onClick={() => setActiveTerminalTab('history')}
                                    className={`px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center gap-1 ${activeTerminalTab === 'history' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                                 >
                                    <History size={10} />
                                    History
                                 </button>
                              </div>


                              <button
                                 onClick={() => setIsIntelligenceRailOpen(false)}
                                 className="hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                              >
                                 <X size={18} />
                              </button>
                           </div>
                        </div>

                        <div className="flex-1 flex flex-col p-2 border-b border-gray-800 overflow-hidden">
                           <AnimatePresence mode="wait">
                              {activeTerminalTab === 'editor' ? (
                                 <motion.div
                                    key="editor"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                                 >
                                    <div className="flex-1 relative group">
                                       <div className="absolute -inset-px bg-linear-to-b from-white/10 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                                       <textarea
                                          value={cypherQuery}
                                          onChange={(e) => setCypherQuery(e.target.value)}
                                          className="w-full h-full bg-slate-900/60 border border-white/5 rounded-xl p-3 text-xs font-mono text-indigo-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none shadow-inner"
                                          placeholder="MATCH (n) RETURN n LIMIT 25..."
                                          spellCheck="false"
                                       />
                                    </div>

                                    {error && (
                                       <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                                       >
                                          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                          <p className="text-[10px] text-red-200 leading-relaxed font-mono">{error}</p>
                                       </motion.div>
                                    )}

                                    <div className="flex items-center gap-4">
                                       <button
                                          onClick={() => {
                                             if (!cypherQuery.trim()) return;
                                             applyFilters(); // Redirect to filter logic
                                          }}
                                          disabled={loading || !cypherQuery.trim()}
                                          className="flex-1 bg-indigo-600 hover:bg-indigo-50 shadow-lg shadow-indigo-600/20 text-white hover:text-indigo-950 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale"
                                       >
                                          <Play size={14} fill="currentColor" />
                                          Execute Query
                                       </button>
                                       <button
                                          onClick={() => {
                                             setCustomGraphData(null);
                                             setCypherQuery('MATCH (n) RETURN n LIMIT 25');
                                             setError(null);
                                          }}
                                          className="size-8 bg-slate-800 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                                          title="Reset Terminal"
                                       >
                                          <RotateCcw size={16} />
                                       </button>
                                    </div>

                                    {customGraphData && (
                                       <div className="flex items-center justify-between px-2 text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                                          <span>Results: {customGraphData.nodes.length} nodes, {customGraphData.relationships.length} edges</span>
                                          <span className="text-vidzai-emerald glow-emerald">Execution Successful</span>
                                       </div>
                                    )}
                                 </motion.div>
                              ) : (
                                 <motion.div
                                    key="history"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex-1 overflow-y-auto custom-scrollbar pr-2"
                                 >
                                    {cypherHistory.length > 0 ? (
                                       <div className="space-y-3">
                                          {cypherHistory.map((h, i) => (
                                             <div
                                                key={i}
                                                onClick={() => {
                                                   setCypherQuery(h);
                                                   setActiveTerminalTab('editor');
                                                }}
                                                className="group p-4 bg-slate-900/40 border border-white/5 rounded-xl cursor-pointer hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all relative overflow-hidden"
                                             >
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <Play size={10} className="text-indigo-400" fill="currentColor" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                   <Clock size={10} className="text-slate-500" />
                                                   <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Entry #{cypherHistory.length - i}</span>
                                                </div>
                                                <code className="text-[10px] font-mono text-indigo-100/70 group-hover:text-indigo-100 leading-relaxed wrap-break-word whitespace-pre-wrap">
                                                   {h}
                                                </code>
                                             </div>
                                          ))}
                                       </div>
                                    ) : (
                                       <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                                          <History size={32} />
                                          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No History Found</p>
                                       </div>
                                    )}
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     </div>


                     {/* METADATA INSPECTOR */}
                     <div className="flex flex-col h-[70%]! border-b border-white/5 overflow-hidden">
                        <div className="p-3 pl-3! border-b border-white/5 flex items-center justify-between bg-slate-950/20">
                           <div className="flex items-center gap-3">
                              <Info size={16} className="text-vidzai-emerald" />
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white ">Entity & Relationship Metadata</h3>
                           </div>
                        </div>
                        <div className="flex overflow-y-auto custom-scrollbar">
                           <SidebarNodeInfo element={selectedElement} />
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Floating Reveal Toggle */}
         {!isIntelligenceRailOpen && (
            <button
               onClick={() => setIsIntelligenceRailOpen(true)}
               className="fixed right-10 bottom-10 size-14 bg-vidzai-emerald rounded-full flex items-center justify-center text-white shadow-2xl shadow-vidzai-emerald/20 border border-vidzai-emerald/40 hover:scale-110 active:scale-95 transition-all z-50 animate-in fade-in zoom-in"
            >
               <MessageSquare size={22} className="text-white" />
            </button>
         )}
      </div>
   );
}
