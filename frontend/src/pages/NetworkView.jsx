import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BloomGraphCanvas from '../components/graph/BloomGraphCanvas';
import SidebarNodeInfo from '../components/sidebar/SidebarNodeInfo';
import { useIntelStore } from '../store/useIntelStore';
import IntelligenceFilterPanel from '../components/graph/IntelligenceFilterPanel';
import StylingLegend from '../components/graph/StylingLegend';
import {
   Network,
   X,
   Layers,
   Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function NetworkView() {
   const location = useLocation();
   const {
      selectedElement,
      setSelectedElement,
      activeSearchPhrase,
      setActiveSearchPhrase,
      isIntelligenceRailOpen,
      setIsIntelligenceRailOpen,
      expandNode,
      viewMode,
      setViewMode,
      executeCypher,
      fetchNodeDetails
   } = useIntelStore();

   const [isStylingLegendOpen, setIsStylingLegendOpen] = useState(false);
   const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

   const [activeFilters, setActiveFilters] = useState({
      entityTypes: [], categories: [], years: [], timePatterns: [],
      messageLength: [], minVolume: 0, showOnlyFlagged: false, diversity: 'All'
   });

   const applyFilters = async (overrides = null) => {
      const filters = overrides || activeFilters;
      let groupClauses = [];
      if (filters.entityTypes.length > 0) groupClauses.push(`n.entity_type IN ${JSON.stringify(filters.entityTypes)}`);
      if (filters.categories.length > 0) groupClauses.push(`n.category IN ${JSON.stringify(filters.categories)}`);
      if (filters.years.length > 0) groupClauses.push(`n.year IN [${filters.years.join(', ')}]`);
      if (filters.timePatterns.length > 0) groupClauses.push(`n.time_category IN ${JSON.stringify(filters.timePatterns)}`);
      if (filters.messageLength.length > 0) {
         const lengthMap = { 'Short': 1, 'Medium': 2, 'Long': 3 };
         groupClauses.push(`n.email_length IN ${JSON.stringify(filters.messageLength.map(l => lengthMap[l]))}`);
      }
      if (filters.minVolume > 0) groupClauses.push(`n.sent_count > ${filters.minVolume}`);
      if (filters.showOnlyFlagged) groupClauses.push(`n.curation_status = 'Flagged'`);
      if (filters.diversity !== 'All') groupClauses.push(`n.diversity_score > ${filters.diversity === 'High' ? 0.6 : 0.3}`);

      const wherePart = groupClauses.length > 0 ? 'WHERE ' + groupClauses.join(' AND ') : '';
      const query = `MATCH (n)-[r]-(m) ${wherePart} RETURN n, r, m LIMIT 300`;
      executeCypher(query);
      setIsFilterPanelOpen(false);
   };

   useEffect(() => {
      const q = new URLSearchParams(location.search).get('q');
      if (q) {
         setActiveSearchPhrase(q);
      } else {
         // Reset: Default to Contextual Probe Discovery
         setViewMode('probe');
         setActiveSearchPhrase('');
      }
   }, [location.search, setActiveSearchPhrase, setViewMode]);

   return (
      <div className="flex h-full w-full bg-transparent overflow-hidden font-sans">
         <div className="flex-1 p-6 relative flex flex-col overflow-hidden">

            {/* Header / Top-Bar */}
            <div className="vidzai-glass-frame rounded-t-2xl border-b-0 h-14 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-xl z-20">
               <div className="flex items-center gap-4">
                  <div className="size-8 rounded-lg bg-vidzai-emerald/10 border border-vidzai-emerald/30 flex items-center justify-center text-vidzai-emerald shadow-lg shadow-vidzai-emerald/5">
                     <Network size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">Knowledge Graph</h3>
               </div>

               <div className="flex items-center gap-1 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-6 mr-2 sm:mr-6">
                     <div className="flex flex-col items-center cursor-pointer group relative">
                        <Sliders size={18} className={`${isFilterPanelOpen ? 'text-vidzai-emerald' : 'text-slate-500'} group-hover:text-vidzai-emerald transition-colors p-1`} onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} />
                        <span className="hidden sm:block text-[8px] uppercase font-bold text-slate-600 mt-1 select-none">Filters</span>
                        <IntelligenceFilterPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} activeFilters={activeFilters} setActiveFilters={setActiveFilters} applyFilters={applyFilters} />
                     </div>
                     <div className="flex flex-col items-center cursor-pointer group relative" onClick={() => setIsStylingLegendOpen(!isStylingLegendOpen)}>
                        <Layers size={18} className={`${isStylingLegendOpen ? 'text-vidzai-emerald' : 'text-slate-500'} group-hover:text-vidzai-emerald transition-colors p-1`} />
                        <span className="hidden sm:block text-[8px] uppercase font-bold text-slate-600 mt-1 select-none">Styling</span>
                        <StylingLegend isOpen={isStylingLegendOpen} onClose={() => setIsStylingLegendOpen(false)} viewMode={viewMode} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Canvas Scene */}
            <div className="flex-1 vidzai-glass-frame border-t-0 rounded-b-2xl overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-vidzai-emerald/20 to-transparent" />

               <BloomGraphCanvas
                  searchPhrase={activeSearchPhrase}
                  onNodeClick={(node) => {
                     setSelectedElement(node);
                     setIsIntelligenceRailOpen(true);
                     if (node?.id) fetchNodeDetails(node.id);
                  }}
                  onRelationshipClick={(rel) => {
                     setSelectedElement(rel);
                     setIsIntelligenceRailOpen(true);
                     if (rel?.id) fetchNodeDetails(rel.id);
                  }}
               />

               {/* Floating Inspector Reopen Button (On Canvas) */}
               <AnimatePresence>
                  {!isIntelligenceRailOpen && selectedElement && (
                     <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={() => setIsIntelligenceRailOpen(true)}
                        className="absolute bottom-6 right-6 z-50 p-4 bg-slate-900/90 backdrop-blur-2xl border border-white/5 rounded-2xl text-vidzai-emerald hover:text-white transition-all shadow-2xl flex items-center justify-center group lg:bottom-8 lg:right-8"
                        title="Open Intelligence Inspector"
                     >
                        <Network size={20} className="group-hover:scale-110 transition-transform"/>
                     </motion.button>
                  )}
               </AnimatePresence>

               {/* Canvas Context Overlay (Redundant stats removed, handled by canvas) */}
            </div>
         </div>

         {/* Intelligence Stack (Right Rail) */}
         <AnimatePresence>
            {isIntelligenceRailOpen && (
               <>
                  {/* Mobile Backdrop */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsIntelligenceRailOpen(false)}
                     className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
                  />
                  <motion.div
                     initial={{ x: 400, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     exit={{ x: 400, opacity: 0 }}
                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="fixed inset-y-0 right-0 lg:relative lg:inset-auto w-full sm:w-[420px] h-full flex flex-col p-4 sm:p-6 lg:pt-6 lg:pr-6 lg:pb-6 z-50 lg:z-45"
                  >
                     <div className="flex-1 vidzai-glass-frame rounded-2xl flex flex-col overflow-hidden bg-slate-900/40">

                        {/* 1. Metadata Header */}
                        <div className="px-5 py-2 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-3xl shrink-0">
                           <div className="flex items-center gap-3">
                              <div className="size-2 bg-vidzai-emerald rounded-full animate-pulse" />
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Metadata</h2>
                           </div>
                           <button
                              onClick={() => setIsIntelligenceRailOpen(false)}
                              className="p-2 border hover:bg-white/5 rounded-full text-slate-500 hover:text-gray-400 transition-all group"
                              title="Minimize Inspector"
                           >
                              <X size={16} />
                           </button>
                        </div>

                        {/* 2. Modular Inspector Section */}
                        <div className="flex-1 overflow-hidden">
                           <SidebarNodeInfo
                              element={selectedElement}
                              onExpand={(node) => expandNode(node.id)}
                              onClose={() => setSelectedElement(null)}
                           />
                        </div>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </div>
   );
}
