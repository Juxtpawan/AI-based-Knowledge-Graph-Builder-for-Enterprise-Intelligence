import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Briefcase,
  Network,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';
import { useIntelStore } from '../store/useIntelStore';

// Modular Components
import BloomGraphCanvas from '../components/graph/BloomGraphCanvas';
import EvidenceBag from '../components/sidebar/EvidenceBag';
import TopicSearchSidebar from '../components/search/TopicSearchSidebar';
import InvestigationBreadcrumbs from '../components/search/InvestigationBreadcrumbs';
import SidebarNodeInfo from '../components/sidebar/SidebarNodeInfo';

export default function TopicExplorer() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isEvidenceBagOpen, setIsEvidenceBagOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const {
    selectedElement,
    setSelectedElement,
    investigationPath,
    addToPath,
    clearInvestigation,
    expandNode,
    evidenceBag,
    unpinNode,
    fetchNodeDetails
  } = useIntelStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const id = params.get('id');
    if (q && id) handleSelectTopic({ name: q, id: id, label: 'CONCEPT' });
  }, [location.search]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]); return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await kgService.getSuggestions(searchQuery);
        setSuggestions(res.suggestions || []);
      } catch (err) { setSuggestions([]); }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setSearchQuery(topic.name);
    setSuggestions([]);
    addToPath({ id: topic.id, name: topic.name, type: 'topic' });
  };

  return (
    <div className="flex h-full w-full bg-slate-950 relative overflow-hidden font-sans">

      <TopicSearchSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={suggestions}
        onSelectTopic={handleSelectTopic}
        selectedTopic={selectedTopic}
        onClear={() => { clearInvestigation(); setSearchQuery(''); }}
      />

      <div className="flex-1 relative bg-slate-950 flex flex-col">

        {/* Floating Sidebar Toggle (Visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 left-6 z-40 p-4 bg-slate-900/90 backdrop-blur-2xl border border-white/5 rounded-[1.2rem] text-slate-400 hover:text-white transition-all shadow-2xl flex items-center gap-2 group"
          >
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2">Topic</span>
          </motion.button>
        )}

        <div className="flex items-center justify-between px-8 py-4 z-30">
          <InvestigationBreadcrumbs
            path={investigationPath}
            onSelectStep={handleSelectTopic}
          />
        </div>

        <div className="flex-1 relative overflow-hidden">
          <BloomGraphCanvas
            searchPhrase={selectedTopic?.name || ''}
            onNodeClick={(node) => {
              setSelectedElement(node);
              setIsInspectorOpen(true);
              if (node?.id) {
                fetchNodeDetails(node.id);
                addToPath({
                  id: node.id,
                  name: node.properties?.name || node.properties?.subject || node.id,
                  type: 'node'
                });
              }
            }}
            onRelationshipClick={(rel) => {
              setSelectedElement(rel);
              setIsInspectorOpen(true);
              if (rel?.id) fetchNodeDetails(rel.id);
            }}
          />

          {/* Action Portals (Bottom-Right) */}
          <div className="absolute right-6 bottom-6 z-40 flex flex-col items-end gap-4">

            {/* Floating Inspector Reopen Button (Beside Bag) */}
            {!isInspectorOpen && selectedElement && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={() => setIsInspectorOpen(true)}
                className="p-4 bg-slate-900/90 backdrop-blur-2xl border border-white/5 rounded-2xl text-vidzai-emerald hover:text-white transition-all shadow-2xl flex items-center justify-center group"
                title="Open Intelligence Inspector"
              >
                <Network size={20} className="group-hover:scale-110 transition-transform" />
              </motion.button>
            )}

            {/* Evidence Bag Portal */}
            <AnimatePresence>
              {isEvidenceBagOpen && (
                <EvidenceBag
                  items={evidenceBag}
                  onRemove={(id) => unpinNode(id)}
                  onClear={() => useIntelStore.setState({ evidenceBag: [] })}
                  onSelect={(node) => setSelectedElement(node)}
                />
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsEvidenceBagOpen(!isEvidenceBagOpen)}
              className={`p-4 rounded-2xl border transition-all shadow-2xl relative ${isEvidenceBagOpen ? 'bg-vidzai-emerald border-vidzai-emerald text-white shadow-vidzai-emerald/40' : 'bg-slate-900/90 border-white/5 text-slate-400 hover:text-white'}`}
            >
              <Briefcase size={20} />
              {evidenceBag.length > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-amber-500 rounded-full text-[10px] font-black flex items-center justify-center text-slate-950 border-2 border-slate-950">
                  {evidenceBag.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Intelligence Stack (Right Rail) */}
      <AnimatePresence>
        {selectedElement && isInspectorOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInspectorOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/60 z-50"
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="relative inset-y-0 right-0 lg:inset-auto w-full sm:w-[400px] h-full flex flex-col bg-slate-900 border-l lg:border-l-0 border-white/5 backdrop-blur-3xl z-50 lg:z-45 shadow-2xl lg:shadow-none"
            >
              {/* Inspector Header */}
              <div className="px-4 sm:px-4 py-3 sm:py-3 border-b border-white/5 flex items-center justify-between bg-slate-950/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-2 bg-vidzai-emerald rounded-full animate-pulse" />
                  <h2 className="text-[14px] sm:text-[14px] font-black uppercase tracking-[0.3em] text-white">MetaData</h2>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                  title="Minimize Inspector"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <SidebarNodeInfo
                  element={selectedElement}
                  onExpand={(node) => expandNode(node.id)}
                  onClose={() => setSelectedElement(null)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
