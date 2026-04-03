import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, Terminal, Play } from 'lucide-react';
import { kgService } from '../../services/apiClient';

/**
 * Omni-Search Component with Autocomplete
 * It takes the current node context and allows the user to find related nodes via NLP search suggestions.
 */
export default function ContextualSearch({
  selectedContext,
  cypherInput,
  setCypherInput,
  onRunCypher,
  onClearCypher,
  onAIPhraseSubmit // Callback for Bloom integration
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Suggested keywords based on input (Autocomplete)
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { suggestions } = await kgService.getSuggestions(query);
        setSuggestions(suggestions);
      } catch (err) {
        console.error('Autocomplete failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4 border-b border-slate-800 bg-slate-900/50 relative">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Enterprise Discovery</p>

      <div className="relative group">
        <input
          type="text"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
          placeholder="Search for Person, Company, Entity..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim() !== '') {
              if (onAIPhraseSubmit) onAIPhraseSubmit(query);
              setSuggestions([]);
            }
          }}
        />
        <Search className="absolute left-3 top-2.5 size-4 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />

        {loading && <Loader2 className="absolute right-3 top-2.5 size-4 text-emerald-500 animate-spin" />}
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-4 right-4 z-100 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 group"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                // Trigger Bloom search update
                if (onAIPhraseSubmit) onAIPhraseSubmit(s.name);
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-100">{s.name}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
              </div>
              <ArrowRight className="size-4 text-slate-700 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}

      {/* Cypher Console Integration */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={12} className="text-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raw Cypher Console</span>
        </div>
        <textarea
          value={cypherInput}
          onChange={(e) => setCypherInput(e.target.value)}
          placeholder="MATCH (n) RETURN n LIMIT 50..."
          className="w-full bg-slate-950/50 border border-slate-800/60 rounded-lg text-[11px] font-mono text-emerald-400 p-3 h-20 outline-none resize-none placeholder-slate-700 focus:border-blue-500/50 transition-colors"
        />
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={onClearCypher}
            className="text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors"
          >
            Reset Graph
          </button>
          <button
            onClick={onRunCypher}
            className="bg-blue-600/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
          >
            <Play size={10} /> Execute
          </button>
        </div>
      </div>

      {/* Selected Node Status */}
      {selectedContext && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
          <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <p className="text-xs text-emerald-400 font-mono truncate">Active Probe: {selectedContext.properties.name || selectedContext.id}</p>
        </div>
      )}
    </div>
  );
}
