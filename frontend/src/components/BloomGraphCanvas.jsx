import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { kgService } from '../services/apiClient';
import { useIntelStore } from '../store/useIntelStore';
import { Loader2, Zap, Maximize2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BloomGraphCanvas Component
 * Replicates the Neo4j Bloom experience using NVL.
 */
export default function BloomGraphCanvas({ searchPhrase = '', onNodeClick }) {
  const [nodes, setNodes] = useState([]);
  const [rels, setRels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const nvlRef = useRef(null);

  // Atomic state sync
  const { setGraphStats, setSelectedElement, customGraphData } = useIntelStore();

  // 1. Fetch graph data
  useEffect(() => {
    const loadGraph = async () => {
      // If we have custom graph data (from Cypher query), use it instead of fetching
      if (customGraphData) {
        setNodes(customGraphData.nodes || []);
        setRels(customGraphData.relationships || []);
        setGraphStats({ 
          nodes: customGraphData.nodes?.length || 0, 
          edges: customGraphData.relationships?.length || 0 
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = isGlobalMode 
          ? { mode: 'global' } 
          : { limit: 1000, q: searchPhrase };
          
        const data = await kgService.getGraphData(params);
        setNodes(data.nodes || []);
        setRels(data.relationships || []);
        
        // Sync stats to global store for Dashboard HUD
        setGraphStats({ 
          nodes: data.nodes?.length || 0, 
          edges: data.relationships?.length || 0 
        });
      } catch (err) {
        console.error('NVL Load Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGraph();
  }, [isGlobalMode, setGraphStats, searchPhrase, customGraphData]);

  // 2. Handle Search-to-Zoom
  useEffect(() => {
    if (searchPhrase && searchPhrase.trim() !== '' && nvlRef.current) {
      const targetNodes = nodes.filter(n => 
        (n.properties.name && n.properties.name.toLowerCase().includes(searchPhrase.toLowerCase())) ||
        (n.properties.subject && n.properties.subject.toLowerCase().includes(searchPhrase.toLowerCase()))
      );

      if (targetNodes.length > 0) {
        const nodeIds = targetNodes.map(n => n.id);
        nvlRef.current.fit(nodeIds, { padding: 100, transitionDuration: 1000 });
      }
    }
  }, [searchPhrase, nodes]);

  // 3. Complex Entity Color Mapping
  const nvlNodes = useMemo(() => {
    return nodes.map(n => {
      const labels = n.labels || [];
      const entityType = n.properties.entity_type || 'Unknown';
      let color = '#94a3b8'; 
      let size = 20;

      if (labels.includes('Employee')) {
        color = '#10b981'; 
        size = 35;
      } else if (labels.includes('Email')) {
        color = '#3b82f6'; 
        size = 22;
      } else if (labels.includes('Entity')) {
        const typeMap = {
          'ORGANIZATION': '#f59e0b',
          'PERSON': '#8b5cf6',
          'GEOGRAPHIC_LOCATION': '#ef4444',
          'STRATEGY': '#ec4899',
          'EVENT': '#06b6d4',
          'COMMODITY': '#14b8a6',
          'PLANT': '#84cc16',
          'LEGAL_TERM': '#64748b',
          'FINANCIAL': '#fbbf24',
          'JOB_TITLE': '#6366f1',
        };
        color = typeMap[entityType] || '#f59e0b';
        size = 28;
      }

      return {
        id: n.id,
        color,
        size: isGlobalMode ? size * 0.8 : size,
        caption: n.properties.name || n.properties.subject || n.id.substring(0, 8),
        properties: n.properties,
        labels: n.labels
      };
    });
  }, [nodes, isGlobalMode]);

  const nvlRels = useMemo(() => rels.map(r => ({
    id: r.id,
    from: r.from,
    to: r.to,
    caption: isGlobalMode ? '' : r.type,
    color: '#475569',
    width: isGlobalMode ? 0.8 : 1.2,
    alpha: isGlobalMode ? 0.2 : 0.4
  })), [rels, isGlobalMode]);

  const handleNodeClick = (node) => {
    setSelectedElement(node); // Atomic sync to Chat + Inspector
    if (onNodeClick) onNodeClick(node);
  };

  const handleNodeDoubleClick = async (node) => {
    try {
      const neighbors = await kgService.getNeighbors(node.id);
      if (neighbors.nodes.length > 0) {
        setNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNodes = neighbors.nodes.filter(n => !existingIds.has(n.id));
          return [...prev, ...newNodes];
        });
        setRels(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newRels = neighbors.relationships.filter(r => !existingIds.has(r.id));
          return [...prev, ...newRels];
        });
      }
    } catch (err) {
      console.error('Expansion Error:', err);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col relative overflow-hidden min-h-[500px]">
      {/* Control Tools */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
        <button 
          onClick={() => {
            const allNodeIds = nodes.map(n => n.id);
            if (allNodeIds.length > 0) {
              nvlRef.current?.fit(allNodeIds, { padding: 50, transitionDuration: 1000 });
            }
          }}
          className="p-3.5 vidzai-glass-frame rounded-2xl text-slate-400 hover:text-white hover:vidzai-neon-glow transition-all group"
          title="Zoom to Fit"
        >
          <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="vidzai-glass-frame p-1.5 rounded-2xl flex gap-1.5 ">
           <button 
             onClick={() => setIsGlobalMode(false)}
             className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!isGlobalMode ? 'bg-vidzai-emerald text-white shadow-lg shadow-vidzai-emerald/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Probe
           </button>
           <button 
             onClick={() => setIsGlobalMode(true)}
             className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isGlobalMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Global
           </button>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="p-3.5 vidzai-glass-frame rounded-2xl text-slate-400 hover:text-white hover:border-danger/50 transition-all group"
          title="Reset"
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <AnimatePresence>
        {loading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center"
            >
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="size-12 text-vidzai-emerald animate-spin" />
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.4em] animate-pulse">Loading Knowledge Graph...</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 cursor-grab active:cursor-grabbing w-full h-full">
        <InteractiveNvlWrapper
          ref={nvlRef}
          nodes={nvlNodes}
          rels={nvlRels}
          nvlOptions={{
            layout: { type: 'forceDirected', clumpiness: isGlobalMode ? 0.8 : 0.6, distance: isGlobalMode ? 160 : 120 },
            style: {
              node: { color: (n) => n.color, size: (n) => n.size, caption: (n) => n.caption, captionColor: '#94a3b8', captionFontSize: isGlobalMode ? 10 : 12 },
              relationship: { color: (r) => r.color, width: (r) => r.width, alpha: (r) => r.alpha, caption: (r) => r.caption, captionColor: '#475569', captionFontSize: 8 }
            }
          }}
          mouseEventCallbacks={{
            onNodeClick: handleNodeClick,
            onNodeDoubleClick: handleNodeDoubleClick,
            onPan: true, onZoom: true
          }}
        />
      </div>
    </div>
  );
}
