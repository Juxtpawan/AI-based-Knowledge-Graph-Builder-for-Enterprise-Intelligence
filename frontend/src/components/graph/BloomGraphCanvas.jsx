import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { useIntelStore } from '../../store/useIntelStore';
import { kgService } from '../../services/apiClient';
import { Search, Globe, Loader2, Focus, RefreshCw, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CypherTerminal from './CypherTerminal';

/**
 * BloomGraphCanvas - High-Fidelity Forensic Graph Engine
 */
export default function BloomGraphCanvas({ searchPhrase, onNodeClick, graphData: externalData }) {
    const nvlRef = useRef();
    const [sourceData, setSourceData] = useState({ nodes: [], relationships: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isCypherOpen, setIsCypherOpen] = useState(false);

    // SAFETY FALLBACKS: Resolving legacy ReferenceErrors from stale HMR bundles
    const graphData = null; 
    const graphStats = useIntelStore.getState().graphStats || { nodes: 0, edges: 0 };

    const {
        viewMode,
        setViewMode,
        setGraphStats,
        customGraphData,
        setSelectedElement,
        selectedElement,
        expandNode,
        cypherQuery,
        setCypherQuery,
        isCypherLoading,
        cypherError,
        executeCypher,
        cypherHistory,
        setCustomGraphData,
        setCypherError
    } = useIntelStore();

    // ─── 1. DATA BRIDGE ───────────────────────────────────────────────────────
    const processedData = useMemo(() => {
        const rawNodes = sourceData?.nodes || [];
        const rawRels  = sourceData?.relationships || sourceData?.links || [];

        // FORENSIC DESIGN TOKENS (Canonical Palette Sync)
        const PALETTE = {
            Employee: { color: '#6366f1', size: 40, borderColor: '#818cf8', borderWidth: 2 },
            Email:    { color: '#f59e0b', size: 30, borderColor: '#fbbf24', borderWidth: 1.5 },
            Topic:    { color: '#14b8a6', size: 30, borderColor: '#2dd4bf', borderWidth: 1.5 },
            Event:    { color: '#10b981', size: 35, borderColor: '#34d399', borderWidth: 2 },
            Legal:    { color: '#ef4444', size: 35, borderColor: '#f87171', borderWidth: 2 },
            Entity:   { color: '#0ea5e9', size: 25, borderColor: '#38bdf8', borderWidth: 1 },
            Default:  { color: '#0ea5e9', size: 25, borderColor: '#38bdf8', borderWidth: 1 }
        };

        // 1. Forensic Category Resolution Logic
        const resolveForensicType = (node) => {
            const rawLabel = node.labels?.[0] || 'Entity';
            const entityType = node.properties?.entity_type?.toUpperCase() || '';
            
            // Priority 1: Label matches canon
            if (['Employee', 'Email', 'Topic', 'Event', 'Legal'].includes(rawLabel)) return rawLabel;

            // Priority 2: Granular Entity Mapping (Keyword Search)
            if (entityType.includes('LEGAL') || entityType.includes('REGULATION') || entityType.includes('CASE')) return 'Legal';
            if (entityType.includes('DATE') || entityType.includes('TIME') || entityType.includes('MEETING') || entityType.includes('EVENT')) return 'Event';
            if (entityType.includes('PERSON') || entityType.includes('ORG') || entityType.includes('EMPLOYEE')) return 'Employee';
            if (entityType.includes('PRICE') || entityType.includes('METRIC') || entityType.includes('COMMODITY') || entityType.includes('INDUSTRY')) return 'Topic';
            if (entityType.includes('SUBJECT') || entityType.includes('EMAIL') || entityType.includes('COMMUNICATION')) return 'Email';

            // Priority 3: Fallback to the label or 'Entity'
            return rawLabel === 'Entity' ? 'Entity' : rawLabel;
        };

        return {
            nodes: rawNodes.map(n => {
                const caption = n.properties?.name || n.properties?.subject || n.properties?.email || String(n.id);
                const forensicType = resolveForensicType(n);

                // 2. Data-Level Style Injection (Defense in Depth)
                let nodeStyle = { ...(PALETTE[forensicType] || PALETTE.Default) };

                // 3. Focus detection for probe mode
                const isFocus = viewMode === 'probe' && searchPhrase && 
                                caption.toLowerCase().includes(searchPhrase.toLowerCase());
                
                // 4. Selection detection
                const isSelected = selectedElement && !selectedElement.isRelationship && String(selectedElement.id) === String(n.id);
                
                if (isSelected) {
                    nodeStyle = {
                        ...nodeStyle,
                        color: '#ffffff',
                        size: 50,
                        borderColor: '#6366f1', 
                        borderWidth: 12,
                        shadowColor: 'rgba(99, 102, 241, 0.95)', 
                        shadowBlur: 50
                    };
                } else if (isFocus) {
                    nodeStyle = {
                        ...nodeStyle,
                        color: '#ffffff', 
                        size: 55, 
                        borderColor: '#10b981', 
                        borderWidth: 8,
                        shadowColor: 'rgba(16,185,129, 0.8)',
                        shadowBlur: 35
                    };
                }

                return {
                    ...n,
                    id: String(n.id),
                    caption,
                    isFocusNode: isFocus,
                    isSelected,
                    // Direct Style Injection (Ensures colors work across all NVL versions)
                    ...nodeStyle,
                    properties: {
                        ...n.properties,
                        forensicType: forensicType
                    }
                };
            }),
            relationships: rawRels.map(r => {
                const isSelected = selectedElement && selectedElement.isRelationship && String(selectedElement.id) === String(r.id);
                // UNIFORM LINK STYLING (Slate Blue Palette Sync)
                let relStyle = { 
                    color: '#64748b', 
                    width: r.type === 'COMMUNICATES_WITH' ? 2 : 1.5,
                    opacity: 0.6 
                };

                if (isSelected) {
                    relStyle = {
                        ...relStyle,
                        color: '#818cf8', 
                        width: 4, 
                        opacity: 1.0
                    };
                }

                return {
                    ...r,
                    id:      String(r.id),
                    from:    String(r.from),
                    to:      String(r.to),
                    caption: r.type,
                    isSelected,
                    ...relStyle
                };
            }),
        };
    }, [sourceData, viewMode, searchPhrase, selectedElement]);

    useEffect(() => {
        // External prop (RAG response graph) → highest priority
        if (externalData) {
            setSourceData(externalData);
            setGraphStats({ nodes: externalData.nodes.length, edges: (externalData.relationships || externalData.links || []).length });
            return;
        }
        // Cypher terminal result → second priority
        if (customGraphData) {
            setSourceData(customGraphData);
            setGraphStats({ nodes: customGraphData.nodes.length, edges: customGraphData.relationships.length });
            return;
        }

        const syncFabric = async () => {
            setIsLoading(true);
            try {
                const params = viewMode === 'global'
                    ? { mode: 'global', limit: 800 } 
                    : { q: searchPhrase || '', limit: 300 };

                const data = await kgService.getGraphData(params);
                setSourceData(data);
                setGraphStats({ nodes: data.nodes.length, edges: (data.relationships || data.links || []).length });
            } catch (err) {
                console.error('Intel_Fabric_Sync_Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        syncFabric();
    }, [viewMode, searchPhrase, externalData, customGraphData, setGraphStats]);

    // ─── 2. PHYSICS & STYLING ARCHETYPES ──────────────────────────────────────
    const nvlOptions = useMemo(() => {
        const isProbe = viewMode === 'probe';
        return {
            layout: 'forceDirected', 
            showCaptions: true,
            showRelCaptions: true,
            initialZoom: 1.0,
            layoutOptions: {
                // Adaptive structural physics based on mode archetype
                barnesHutTheta: isProbe ? 0.1 : 0.9,  // Precision vs Scalability
                gravity:        isProbe ? -1.0 : -3.5, // Contextual spread vs Structural density
                friction:       isProbe ? 0.4  : 0.15, // Smooth flow vs Stable constellation
                linkDistance:   isProbe ? 60   : 250, // Proximity vs Connectivity
                linkStrength:   isProbe ? 1.5  : 0.2, // Spring-focused vs Hierarchy-focused
                iterations: 150,
            },
            // REDUNDANT INTERACTION ENABLING
            interaction: {
                pan: true,
                zoom: true,
                drag: true
            },
            // Forensic Style Engine (Dynamic High-Priority Overrides)
            styleRules: [
                // Category Overrides (Adding Shadows to Data-Level Styles)
                { condition: (node) => node.properties?.forensicType === 'Employee', style: { shadowColor: 'rgba(99, 102, 241, 0.4)', shadowBlur: 10 } },
                { condition: (node) => node.properties?.forensicType === 'Email',    style: { shadowColor: 'rgba(245, 158, 11, 0.4)', shadowBlur: 8 } },
                { condition: (node) => node.properties?.forensicType === 'Event',    style: { shadowColor: 'rgba(16, 185, 129, 0.4)', shadowBlur: 10 } },
                { condition: (node) => node.properties?.forensicType === 'Legal',    style: { shadowColor: 'rgba(239, 68, 68, 0.4)', shadowBlur: 10 } }
            ],
            relStyleRules: [
                { condition: { type: '*' }, style: { color: '#64748b', width: 1.5, opacity: 0.5 } }
            ]
        };
    }, [viewMode, selectedElement]);

    // ─── 4. INTERACTION HANDLERS ──────────────────────────────────────────────
    // Node click → set as selectedElement → Sidebar opens Inspector tab
    const handleNodeClick = useCallback((node) => {
        setSelectedElement(node);
        if (onNodeClick) onNodeClick(node);
    }, [onNodeClick, setSelectedElement]);

    // Relationship click → set with isRelationship flag → Sidebar shows rel metadata
    const handleRelClick = useCallback((rel) => {
        setSelectedElement({ ...rel, isRelationship: true });
    }, [setSelectedElement]);

    // Double-click → expand neighbors into current graph
    const handleNodeDblClick = useCallback((node) => {
        expandNode(String(node.id));
    }, [expandNode]);

    const mouseEventCallbacks = useMemo(() => ({
        onNodeClick: handleNodeClick,
        onNodeDoubleClick: handleNodeDblClick,
        onRelationshipClick: handleRelClick,
        // EXPLICIT HAND/PAN/ZOOM ENABLEMENT
        onPan: true,
        onZoom: true,
        onDrag: true
    }), [handleNodeClick, handleNodeDblClick, handleRelClick]);

    return (
        <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col font-sans group">

            {/* ── MODE SWITCHER ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                <div className="flex bg-slate-900/90 backdrop-blur-2xl border border-white/5 p-1.5 rounded-[1.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <button
                        onClick={() => setViewMode('probe')}
                        title="Probe: contextual subgraph"
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${
                            viewMode === 'probe'
                                ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Focus size={14} className={viewMode === 'probe' ? '' : 'group-hover:text-emerald-500'} />
                        PROBE
                    </button>
                    <button
                        onClick={() => setViewMode('global')}
                        title="Global: full enterprise knowledge graph"
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${
                            viewMode === 'global'
                                ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Globe size={14} className={viewMode === 'global' ? '' : 'group-hover:text-emerald-500'} />
                        GLOBAL
                    </button>
                </div>
            </div>


            {/* ── CYPHER TERMINAL TOGGLE ── */}
            <div className="absolute top-16 left-6 z-40">
                <button
                    onClick={() => setIsCypherOpen(!isCypherOpen)}
                    title="Open Cypher Terminal"
                    className={`p-4 rounded-[1.2rem] border transition-all shadow-2xl ${
                        isCypherOpen
                            ? 'bg-indigo-500 border-indigo-400 text-white shadow-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                            : 'bg-slate-900/90 border-white/5 text-slate-400 hover:text-white'
                    }`}
                >
                    <Search size={18} />
                </button>
            </div>

            {/* ── CYPHER TERMINAL PANEL ── */}
            <AnimatePresence>
                {isCypherOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.95 }}
                        className="absolute top-28 left-24 z-40 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl w-[450px] h-[380px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
                    >
                        <CypherTerminal 
                            query={cypherQuery} 
                            setQuery={setCypherQuery} 
                            onExecute={() => executeCypher()} 
                            history={cypherHistory} 
                            loading={isCypherLoading} 
                            error={cypherError}
                            onReset={() => { setCustomGraphData(null); setCypherQuery('MATCH (n) RETURN n LIMIT 25'); setCypherError(null); }}
                            onClose={() => setIsCypherOpen(false)}
                            resultsCount={customGraphData?.nodes.length}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CORE NVL VIEWPORT ── */}
            <div className="flex-1 relative cursor-grab active:cursor-grabbing transition-[cursor]">
                <InteractiveNvlWrapper
                    ref={nvlRef}
                    nodes={processedData.nodes}
                    rels={processedData.relationships}
                    nvlOptions={nvlOptions}
                    mouseEventCallbacks={mouseEventCallbacks}
                    interaction={{ pan: true, zoom: true, drag: true }} 
                    allowPan={true}
                    allowZoom={true}
                    allowDrag={true}
                    useCommands={true}
                    style={{ cursor: 'grab', width: '100%', height: '100%' }}
                />
            </div>

            {/* ── STATS HUD ── */}
            <div className="absolute top-4 right-4 z-20 vidzai-glass-frame p-2 rounded-xl border-white/5 bg-slate-900/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <div className="size-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <span className="text-[8px] font-mono text-slate-200">Nodes: {processedData.nodes.length}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                        <span className="text-[8px] font-mono text-slate-200">Edges: {processedData.relationships.length}</span>
                    </div>
                </div>
            </div>

            {/* ── LOADING OVERLAY ── */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50 pointer-events-none"
                    >
                        <Loader2 size={36} className="text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            {viewMode === 'global' ? 'Loading Enterprise Snapshot...' : 'Syncing Contextual Graph...'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STATUS HUD ── */}
            <div className="absolute bottom-6 left-6 z-40 flex items-center gap-4">
                <div className="flex bg-slate-900/90 border border-white/5 p-1 rounded-2xl">
                    <button
                        onClick={() => {
                            if (!nvlRef.current) return;
                            const focusNodes = processedData.nodes.filter(n => n.isFocusNode);
                            const ids = focusNodes.length > 0 
                                ? focusNodes.map(n => n.id) 
                                : processedData.nodes.map(n => n.id);
                            nvlRef.current.fit(ids);
                        }}
                        className="p-3.5 text-slate-500 hover:text-white transition-colors"
                        title={searchPhrase ? "Focus on search results" : "Fit all nodes"}
                    >
                        <Focus size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (nvlRef.current) nvlRef.current.restart();
                        }}
                        className="p-3.5 text-slate-500 hover:text-white transition-colors border-l border-white/5"
                        title="Reset graph layout"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* ── NEURAL AMBIENCE ── */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-slate-950 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-40 bg-linear-to-t from-slate-950 to-transparent pointer-events-none" />
        </div>
    );
}
