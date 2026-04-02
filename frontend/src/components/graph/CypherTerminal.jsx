import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, History, Play, RotateCcw, AlertCircle, Clock, X } from 'lucide-react';

/**
 * CypherTerminal - Interactive Query Editor
 * Handles Cypher code execution and result history.
 */
export default function CypherTerminal({ 
    query, 
    setQuery, 
    onExecute, 
    history, 
    loading, 
    error, 
    onReset, 
    onClose,
    resultsCount 
}) {
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'history'

    return (
        <div className="flex flex-col h-full bg-slate-950/20">
            {/* Terminal Top Bar */}
            <div className="p-2 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center w-[50%] pl-0.5 gap-3">
                    <div className="size-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Terminal size={12} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Cypher Terminal</h3>
                </div>
                <div className="flex items-center w-[50%] justify-end gap-2">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${activeTab === 'editor' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center gap-1 ${activeTab === 'history' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <History size={10} />
                            History
                        </button>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Viewport Core */}
            <div className="flex-1 flex flex-col p-2 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'editor' ? (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex-1 flex flex-col gap-4 overflow-hidden"
                        >
                            <div className="flex-1 relative group">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
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
                                    onClick={onExecute}
                                    disabled={loading || !query.trim()}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-50 shadow-lg shadow-indigo-600/20 text-white hover:text-indigo-950 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    <Play size={14} fill="currentColor" />
                                    {loading ? 'Executing...' : 'Execute Query'}
                                </button>
                                <button
                                    onClick={onReset}
                                    className="size-8 bg-slate-800 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                                    title="Reset Terminal"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>

                            {resultsCount !== undefined && resultsCount >= 0 && (
                                <div className="flex items-center justify-between px-2 text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                                    <span>Results: Cached in Frame</span>
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
                            {history.length > 0 ? (
                                <div className="space-y-3">
                                    {history.map((h, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setQuery(h);
                                                setActiveTab('editor');
                                            }}
                                            className="group p-4 bg-slate-900/40 border border-white/5 rounded-xl cursor-pointer hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={10} className="text-indigo-400" fill="currentColor" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={10} className="text-slate-500" />
                                                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Entry #{history.length - i}</span>
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
    );
}
