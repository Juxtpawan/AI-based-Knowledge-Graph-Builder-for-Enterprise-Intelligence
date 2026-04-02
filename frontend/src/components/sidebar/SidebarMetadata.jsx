import React from 'react';
import { Tag, Database, Calendar, Link } from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarMetadata = ({ properties }) => {
  if (!properties) return null;

  const entries = Object.entries(properties).filter(([key]) => 
    !['verified', 'name', 'subject', 'id'].includes(key.toLowerCase())
  );

  return (
    <div className="p-6 border-b border-white/5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-slate-500" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Extended Intelligence</h3>
      </div>
      
      <div className="space-y-3">
        {entries.length > 0 ? entries.map(([key, value], idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              {key.toLowerCase().includes('date') ? <Calendar className="w-3 h-3 text-indigo-400 opacity-60" /> : 
               key.toLowerCase().includes('url') ? <Link className="w-3 h-3 text-emerald-400 opacity-60" /> : 
               <Tag className="w-3 h-3 text-slate-500 opacity-60" />}
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm font-medium text-slate-200 break-all leading-tight">
              {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
            </p>
          </motion.div>
        )) : (
          <div className="p-6 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Metadata Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarMetadata;
