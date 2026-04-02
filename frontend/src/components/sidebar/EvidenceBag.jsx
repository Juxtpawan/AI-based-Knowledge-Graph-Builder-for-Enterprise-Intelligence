import React from 'react';
import { Briefcase, X, FileText, Share2, User, Globe, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EvidenceBag = ({ items = [], onRemove, onExport, isOpen, onClose }) => {
  // Mock items for design if empty
  const displayItems = items.length > 0 ? items : [
    { id: '1', label: 'Person', name: 'John Doe', type: 'High Risk' },
    { id: '2', label: 'Email', name: 'Confidential Strategy', type: 'Flagged' },
    { id: '3', label: 'Organization', name: 'Nexus Corp', type: 'Verified' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed right-6 top-6 bottom-6 w-80 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-indigo-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evidence Bag</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{items.length} Intelligence Items</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar mt-2">
            {displayItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-white/5">
                    {item.label === 'Email' ? <FileText className="w-4 h-4 text-indigo-400" /> : 
                     item.label === 'Person' ? <User className="w-4 h-4 text-indigo-400" /> : <Globe className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.name}</p>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Background trace */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-2xl -z-10 rounded-full" />
              </motion.div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-white/5 bg-white/5 space-y-3">
            <button 
              onClick={onExport}
              className="w-full flex items-center justify-center gap-3 p-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              GENERATE REPORT
            </button>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-400 transition-all uppercase tracking-widest">
                <Share2 className="w-3 h-3" />
                Collab
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-400 transition-all uppercase tracking-widest">
                <MoreHorizontal className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EvidenceBag;
