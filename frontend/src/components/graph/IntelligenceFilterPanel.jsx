import React, { useState } from 'react';
import { 
  X, Filter, Search, ShieldCheck, AlertCircle, Calendar, 
  BarChart, Activity, Globe, Scale, Users, Layers, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * IntelligenceFilterPanel - High-Fidelity Forensic Filtering
 * Updated with Single-Vector Selection and Deferred Application.
 */
export default function IntelligenceFilterPanel({ 
  isOpen, onClose, activeFilters, setActiveFilters, applyFilters 
}) {
  // 1. Local State for "Pending" filters (to support Deferred Apply)
  const [pendingFilters, setPendingFilters] = useState(activeFilters);

  // Sync pending filters with active filters whenever the panel opens
  React.useEffect(() => {
    if (isOpen) {
      setPendingFilters(activeFilters);
    }
  }, [isOpen, activeFilters]);

  const sections = [
    {
      id: 'structural',
      label: 'Structural Entities',
      icon: Globe,
      options: ['ORGANIZATION', 'GEOGRAPHIC_LOCATION', 'EVENT', 'JOB_TITLE', 'DEPARTMENT']
    },
    {
      id: 'forensics',
      label: 'Categories',
      icon: ShieldCheck,
      options: ['Energy Trading', 'Financial & Accounting', 'HR & Internal', 'Legal & Regulatory', 'News & Media']
    },
    {
      id: 'temporal',
      label: 'select by years',
      icon: Calendar,
      options: ['1999', '2000', '2001', '2002']
    },
    {
      id: 'metabolic',
      label: 'select by time',
      icon: Activity,
      options: ['Morning', 'Afternoon', 'Evening', 'Night']
    }
  ];

  if (!isOpen) return null;

  const handleApply = () => {
    setActiveFilters(pendingFilters);
    applyFilters(pendingFilters); 
    onClose();
  };

  const handleReset = () => {
    const fresh = {
      entityTypes: [], categories: [], years: [], timePatterns: [],
      messageLength: [], minVolume: 0, showOnlyFlagged: false, diversity: 'All'
    };
    setPendingFilters(fresh);
  };

  const toggleOption = (sectionId, option) => {
    // 1. Identify which field we're targeting based on section
    const fieldMap = {
      structural: 'entityTypes',
      forensics: 'categories',
      metabolic: 'timePatterns',
      temporal: 'years'
    };
    const targetField = fieldMap[sectionId];
    
    // 2. Handle numeric conversion for years
    const formalValue = sectionId === 'temporal' ? Number(option) : option;
    const isSelected = (pendingFilters[targetField] || []).includes(formalValue);

    // 3. Reset ALL fields to empty arrays (Single-Vector constraint)
    const freshState = {
      entityTypes: [], categories: [], years: [], timePatterns: [],
      messageLength: [], minVolume: 0, showOnlyFlagged: false, diversity: 'All'
    };

    // 4. Set only the targeted option (if not toggling off)
    if (!isSelected) {
      freshState[targetField] = [formalValue];
    }

    setPendingFilters(freshState);
  };

  return (
    <div className="absolute top-10 -right-20 w-[calc(100vw-2rem)] max-w-[340px] z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="vidzai-glass rounded-3xl sm:rounded-4xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-900/90 backdrop-blur-3xl flex flex-col max-h-[80vh] sm:max-h-[400px]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40 shrink-0">
           <div className="flex items-center gap-4">
              <div className="p-2.5 bg-vidzai-emerald/10 rounded-2xl">
                 <Filter className="text-vidzai-emerald" size={20} />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Filters</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Single-Vector Selection</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
              <X size={18} />
           </button>
        </div>

        {/* Filter Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
           {sections.map((section) => (
             <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-3">
                   <section.icon size={14} className="text-slate-600" />
                   <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{section.label}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                   {section.options.map(option => {
                      const fieldMap = { structural: 'entityTypes', forensics: 'categories', metabolic: 'timePatterns', temporal: 'years' };
                      const formalValue = section.id === 'temporal' ? Number(option) : option;
                      const isSelected = (pendingFilters[fieldMap[section.id]] || []).includes(formalValue);
                      
                      return (
                        <button
                          key={option}
                          onClick={() => toggleOption(section.id, option)}
                          className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                            isSelected
                            ? 'bg-vidzai-emerald text-white border-vidzai-emerald shadow-lg shadow-vidzai-emerald/20'
                            : 'bg-slate-800/40 text-slate-500 border-white/5 hover:border-white/20'
                          }`}
                        >
                           {option}
                        </button>
                      );
                   })}
                </div>
             </div>
           ))}

        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-white/5 flex gap-4 shrink-0">
           <button 
              onClick={handleReset}
              className="px-6 py-4 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white hover:bg-slate-900 transition-all"
           >
              Reset
           </button>
           <button 
              onClick={handleApply}
              className="flex-1 py-4 bg-vidzai-emerald text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-vidzai-emerald/20 border border-vidzai-emerald hover:scale-[1.02] active:scale-[0.98] transition-all"
           >
              Apply Filter
           </button>
        </div>
      </motion.div>
    </div>
  );
}
