import React, { useState, useEffect } from 'react';
import { Search, Command, Terminal, Share2, Database, Layout, MessageSquare, Zap, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items = [
    { id: 'search', label: 'Global Knowledge Search', icon: Search, shortcut: 'S', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'query', label: 'Execute Cypher Query', icon: Terminal, shortcut: 'Q', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'chat', label: 'Open Intelligence Chat', icon: MessageSquare, shortcut: 'C', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'graph', label: 'Network Visualization', icon: Share2, shortcut: 'V', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'dashboard', label: 'Analytics Dashboard', icon: Layout, shortcut: 'D', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'ingest', label: 'Data Ingestion Status', icon: Database, shortcut: 'I', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'pulse', label: 'Network Pulse Analysis', icon: Zap, shortcut: 'P', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const filtered = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Command className="w-5 h-5 text-indigo-400" />
              </div>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search entities..."
                className="flex-1 bg-transparent border-none focus:outline-none text-white text-lg placeholder:text-slate-500 h-10"
              />
              <div className="flex gap-2 items-center">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-500 font-bold tracking-widest">ESC</span>
                <button onClick={() => onClose(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-2 scroll-smooth">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => { onSelect(item.id); onClose(false); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-xl transition-all group border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Nexus Engine Action</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-500 font-bold group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                        {item.shortcut}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                  <Search className="w-8 h-8 opacity-20" />
                  <p className="font-medium">No results found for <span className="text-white">"{query}"</span></p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-white/5 border-t border-white/10 flex justify-between items-center px-4">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                <span className="text-indigo-500">Vidzai</span> Forensics Terminal
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Execute</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
