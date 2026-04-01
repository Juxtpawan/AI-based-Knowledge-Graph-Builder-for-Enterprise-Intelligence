import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info } from 'lucide-react';

/**
 * IntelligenceFilterPanel - Simplified Single-Select Forensic Filters Component
 * 
 * Props:
 * - isOpen: Boolean, controls the popover visibility
 * - onClose: Function, triggered when the user clicks 'X' or outside
 * - activeFilters: Object, current filter state
 * - setActiveFilters: Function, setter for filter state
 * - applyFilters: Function, triggers the graph query update
 */
const IntelligenceFilterPanel = ({ 
    isOpen, 
    onClose, 
    activeFilters, 
    setActiveFilters, 
    applyFilters 
}) => {
    
    // Helper to handle exclusive single-selection across ALL categories
    const handleSingleSelect = (key, value) => {
        // Reset everything else and only set the chosen filter
        const newState = {
            entityTypes: [],
            categories: [],
            years: [],
            timePatterns: [],
            messageLength: [],
            minVolume: 0,
            showOnlyFlagged: false,
            diversity: 'All'
        };

        // Determine how to set the value based on typical data structure
        if (key === 'minVolume' || key === 'showOnlyFlagged' || key === 'diversity') {
            newState[key] = activeFilters[key] === value ? (key === 'diversity' ? 'All' : (key === 'minVolume' ? 0 : false)) : value;
        } else {
            // For arrays, we just wrap the single value
            newState[key] = activeFilters[key].includes(value) ? [] : [value];
        }

        setActiveFilters(newState);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 -right-20 w-[420px] vidzai-glass-frame p-6 rounded-3xl z-50 shadow-2xl bg-slate-900/98 backdrop-blur-3xl border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Forensic Filter</h4>
                            <span className="text-[8px] font-bold text-indigo-400 uppercase mt-1 tracking-widest">Select One Filter Only</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setActiveFilters({
                                    entityTypes: [], categories: [], years: [], timePatterns: [], messageLength: [], minVolume: 0, showOnlyFlagged: false, diversity: 'All'
                                })}
                                className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Reset
                            </button>
                            <X size={12} className="text-slate-500 hover:text-white cursor-pointer" onClick={onClose} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* Entity Types */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Entity Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Person', 'Organization', 'Location'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleSingleSelect('entityTypes', type)}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${activeFilters.entityTypes.includes(type) ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Email Categories */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Email Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Energy Trading', 'Legal', 'Financial'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => handleSingleSelect('categories', cat)}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${activeFilters.categories.includes(cat) ? 'bg-vidzai-emerald border-vidzai-emerald text-slate-900 shadow-lg shadow-vidzai-emerald/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Temporal Pattern */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Time Pattern</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Morning', 'Afternoon', 'Evening', 'Night'].map(tp => (
                                        <button
                                            key={tp}
                                            onClick={() => handleSingleSelect('timePatterns', tp)}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${activeFilters.timePatterns.includes(tp) ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {tp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Message Length */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Verbosity (Length)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Short', 'Medium', 'Long'].map(l => (
                                        <button
                                            key={l}
                                            onClick={() => handleSingleSelect('messageLength', l)}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${activeFilters.messageLength.includes(l) ? 'bg-fuchsia-500 border-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Communication Volume */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Email Volume</label>
                                <div className="flex gap-2">
                                    {[20, 50, 100].map(vol => (
                                        <button
                                            key={vol}
                                            onClick={() => handleSingleSelect('minVolume', vol)}
                                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${activeFilters.minVolume === vol ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {vol}+
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Curation Insight */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Anomaly Filter</label>
                                <button
                                    onClick={() => handleSingleSelect('showOnlyFlagged', !activeFilters.showOnlyFlagged)}
                                    className={`w-full py-2.5 rounded-xl text-[9px] font-bold border transition-all flex items-center justify-center gap-2 ${activeFilters.showOnlyFlagged ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                >
                                    <AlertCircle size={12} />
                                    {activeFilters.showOnlyFlagged ? 'Flagged Only' : 'Show All Anomalies'}
                                </button>
                            </div>

                            <button
                                onClick={applyFilters}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all mt-4"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                        <Info size={10} className="text-indigo-400" />
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider italic">Note: Only one filter vector can be active at a time for investigation clarity.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntelligenceFilterPanel;
