import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BloomGraphCanvas from '../components/graph/BloomGraphCanvas';
import SidebarNodeInfo from '../components/sidebar/SidebarNodeInfo';
import EvidenceBag from '../components/sidebar/EvidenceBag';
import CommandPalette from '../components/search/CommandPalette';
import ContextualSearch from '../components/search/ContextualSearch';
import InvestigationBreadcrumbs from '../components/search/InvestigationBreadcrumbs';
import { useIntelStore } from '../store/useIntelStore';
import IntelligenceFilterPanel from '../components/graph/IntelligenceFilterPanel';
import StylingLegend from '../components/graph/StylingLegend';
import {
   Network,
   Sliders,
   Layers,
   Briefcase,
   Command
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
      executeCypher,
      viewMode,
      setViewMode
   } = useIntelStore();

   const [isStylingLegendOpen, setIsStylingLegendOpen] = useState(false);
   const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
   const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
   const [isEvidenceBagOpen, setIsEvidenceBagOpen] = useState(false);
   
   const [activeFilters, setActiveFilters] = useState({
      entityTypes: [], categories: [], years: [], timePatterns: [],
      messageLength: [], minVolume: 0, showOnlyFlagged: false, diversity: 'All'
   });

   const applyFilters = async () => {
      let groupClauses = [];
      if (activeFilters.entityTypes.length > 0) groupClauses.push(`n.entity_type IN ${JSON.stringify(activeFilters.entityTypes)}`);
      if (activeFilters.categories.length > 0) groupClauses.push(`n.category IN ${JSON.stringify(activeFilters.categories)}`);
      const query = `MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 300`;
      executeCypher(query);
      setIsFilterPanelOpen(false);
   };

   useEffect(() => {
      const q = new URLSearchParams(location.search).get('q');
      if (q) {
         setActiveSearchPhrase(q);
      } else {
         setViewMode('probe');
         setActiveSearchPhrase('');
      }
   }, [location.search, setActiveSearchPhrase, setViewMode]);

   return (
      <div className="flex h-full w-full bg-[#020617] overflow-hidden font-sans relative">
         <div className="flex-1 p-6 relative flex flex-col overflow-hidden">
            
            {/* 1. Forensic Header / Top-Bar */}
            <div className="mb-6 flex flex-col gap-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10">
                           <Network size={22} className="animate-pulse" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">Intelligence Nexus</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enron Forensic Cluster v4.2</p>
                        </div>
                     </div>
                     <InvestigationBreadcrumbs crumbs={[]} />
                  </div>

                  <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-3 group"
                     >
                        <Command size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Command Hub</span>
                        <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold">⌘K</div>
                     </button>
                     
                     <button 
                        onClick={() => setIsEvidenceBagOpen(true)}
                        className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-indigo-400 hover:text-white transition-all flex items-center gap-3 group"
                     >
                        <Briefcase size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Evidence Bag</span>
                     </button>
                  </div>
               </div>

               {/* 2. Multi-Dimensional Search */}
               <div className="max-w-4xl mx-auto w-full px-2">
                  <ContextualSearch onSearch={(q) => setActiveSearchPhrase(q)} isLoading={false} />
               </div>
            </div>

            {/* 3. Main Network Canvas Scene */}
            <div className="flex-1 relative bg-slate-950/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group/canvas">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent z-10" />
               <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-3">
                  <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className="p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all shadow-2xl group">
                     <Sliders size={20} />
                  </button>
                  <button onClick={() => setIsStylingLegendOpen(!isStylingLegendOpen)} className="p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all shadow-2xl group">
                     <Layers size={20} />
                  </button>
               </div>

               <BloomGraphCanvas 
                  searchPhrase={activeSearchPhrase} 
                  onNodeClick={(node) => {
                     setSelectedElement(node);
                     setIsIntelligenceRailOpen(true);
                  }} 
               />
               
               {/* Overlays */}
               <IntelligenceFilterPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} activeFilters={activeFilters} setActiveFilters={setActiveFilters} applyFilters={applyFilters}/>
               <StylingLegend isOpen={isStylingLegendOpen} onClose={() => setIsStylingLegendOpen(false)} viewMode={viewMode}/>
            </div>
         </div>

         {/* Intelligence & Evidence Modals */}
         <AnimatePresence>
            {isIntelligenceRailOpen && (
               <SidebarNodeInfo 
                  node={selectedElement} 
                  onClose={() => setIsIntelligenceRailOpen(false)}
                  onAction={(id) => console.log('Action:', id)}
               />
            )}
         </AnimatePresence>

         <EvidenceBag 
            isOpen={isEvidenceBagOpen} 
            onClose={() => setIsEvidenceBagOpen(false)} 
            onRemove={(id) => console.log('Remove:', id)} 
         />

         <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            onClose={setIsCommandPaletteOpen}
            onSelect={(id) => console.log('Selected:', id)}
         />
      </div>
   );
}
