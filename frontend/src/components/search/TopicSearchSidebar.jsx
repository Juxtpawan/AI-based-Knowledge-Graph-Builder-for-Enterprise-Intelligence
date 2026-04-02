import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Search, X, ChevronLeft, Database, Network } from 'lucide-react';

/**
 * TopicSearchSidebar - Semantic Search and Concept Cluster Panel
 */
export default function TopicSearchSidebar({ 
    isOpen, 
    onClose, 
    searchQuery, 
    setSearchQuery, 
    suggestions, 
    onSelectTopic, 
    selectedTopic, 
    onClear 
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ x: -320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -320, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed lg:relative left-0 top-0 lg:top-auto h-full w-80 vidzai-glass-frame border-r border-white/5 flex flex-col z-45 bg-slate-950/20 shadow-2xl"
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
                            <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-800 rounded-full text-slate-500">
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
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xl font-sans"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={onClear}
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
                                    className="absolute left-6 right-6 mt-4 glass-panel-heavy rounded-2xl shadow-2xl overflow-hidden z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10"
                                >
                                    {suggestions.map((s, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => onSelectTopic(s)}
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
                                    <p className="text-[14px] text-slate-400 leading-relaxed font-sans">
                                        Tracing <span className="text-indigo-300">Semantic Nodes</span>. The graph engine isolates all emails mentioning this concept, mapping structural links to employees.
                                    </p>
                                    
                                    <div className="p-5 vidzai-glass-frame rounded-2xl border-dashed bg-slate-900/10 border-slate-800">
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
    );
}
