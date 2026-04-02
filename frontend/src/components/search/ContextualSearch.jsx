import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ContextualSearch = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Entities', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'person', label: 'People', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'org', label: 'Organizations', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'email', label: 'Communications', color: 'text-rose-400', bg: 'bg-rose-500/10' }
  ];

  const handleSearch = () => {
    if (!query.trim()) return;
    onSearch(query, activeFilter);
  };

  return (
    <div className="w-full space-y-3">
      <div className="relative group/search">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-2xl blur-md opacity-0 group-hover/search:opacity-100 transition-all duration-700" />
        
        <div className="relative flex items-center bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all group-focus-within/search:border-indigo-500/50">
          <div className="p-4 flex items-center justify-center text-slate-500">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <Search className="w-5 h-5" />}
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for entities, names, or key terms..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm h-12"
          />
          
          <div className="flex items-center gap-2 p-2 pr-4 border-l border-white/5">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-slate-400 group-hover/search:text-slate-200"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="uppercase tracking-widest">{filters.find(f => f.id === activeFilter)?.label.split(' ')[0]}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button 
              onClick={handleSearch}
              className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-all shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-3 p-3 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl z-20 shadow-2xl overflow-hidden"
            >
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-3 mb-2">Scope Search</div>
              <div className="grid grid-cols-2 gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFilter(f.id); setShowFilters(false); }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all border 
                      ${activeFilter === f.id ? `${f.bg} ${f.color} border-white/10` : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${f.id === activeFilter ? 'bg-current animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-xs font-bold tracking-wide uppercase">{f.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {query && (
        <p className="text-[10px] text-slate-500 px-4 font-medium italic">
          Tip: Exploring <span className="text-indigo-400">"{query}"</span> across {activeFilter === 'all' ? 'all organizational dimensions' : `the ${activeFilter} domain`}.
        </p>
      )}
    </div>
  );
};

export default ContextualSearch;
