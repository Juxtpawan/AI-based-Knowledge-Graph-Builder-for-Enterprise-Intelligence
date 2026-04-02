import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ArrowRight, BrainCircuit, Users, FileText } from 'lucide-react';
import { kgService } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await kgService.getSuggestions(query);
        setResults(res.suggestions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    // For now, navigate to Graph with search phrase or Topic Explorer
    if (item.label === 'Employee') {
        navigate(`/explore?q=${encodeURIComponent(item.name)}`);
    } else {
        navigate(`/graph-studio?q=${encodeURIComponent(item.name)}&id=${item.id}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-100"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-101 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-4">
              <Search className="text-slate-500" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Global Entity Search (Employees, Partners, Concepts...)"
                className="flex-1 bg-transparent border-none outline-none text-slate-100 text-lg placeholder:text-slate-600 font-medium"
              />
              <div className="flex items-center gap-2">
                 <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">ESC</span>
                 <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500">
                    <X size={18} />
                 </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
              {loading && (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono uppercase tracking-widest">Querying Intelligence...</span>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="py-2">
                  <h3 className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Semantic Suggestions</h3>
                  {results.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all ${
                        idx === selectedIndex ? 'bg-primary/10 border border-primary/20' : 'border border-transparent hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          item.label === 'Employee' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                           {item.label === 'Employee' ? <Users size={16} /> : <BrainCircuit size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{item.label}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className={`text-slate-700 transition-all ${idx === selectedIndex ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                    </button>
                  ))}
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-500 font-medium">No direct matches in the Knowledge Graph.</p>
                  <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase">Try searching concepts like "Meeting", "California" or "Lavorato"</p>
                </div>
              )}

              {query.length < 2 && (
                <div className="p-6 grid grid-cols-2 gap-4">
                   <div className="p-4 glass-panel rounded-2xl flex flex-col gap-2">
                      <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                         <Search size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300">Smart Search</h4>
                      <p className="text-[10px] text-slate-500">Find any node across the entire Enron network instantly.</p>
                   </div>
                   <div className="p-4 glass-panel rounded-2xl flex flex-col gap-2">
                      <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                         <Command size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300">Navigation</h4>
                      <p className="text-[10px] text-slate-500">Quickly jump between Discovery and Agentic modules.</p>
                   </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/50 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-600">
               <div className="flex gap-4">
                  <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">↑↓</kbd> Navigate</span>
                  <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">ENTER</kbd> Open Knowledge</span>
               </div>
               <div className="flex items-center gap-1">
                  <Command size={10} />
                  <span>Vidzai Intel Search</span>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
