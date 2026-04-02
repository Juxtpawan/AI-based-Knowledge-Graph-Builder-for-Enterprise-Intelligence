import React from 'react';
import { ChevronRight, Home, Microscope, Layers, UserSearch } from 'lucide-react';
import { motion } from 'framer-motion';

const InvestigationBreadcrumbs = ({ crumbs = [] }) => {
  // Mock crumbs for design if none provided
  const displayCrumbs = crumbs.length > 0 ? crumbs : [
    { label: 'Global Intelligence', icon: Home },
    { label: 'Network Scan', icon: Layers },
    { label: 'Entity Investigation', icon: Microscope }
  ];

  return (
    <nav className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit backdrop-blur-md">
      {displayCrumbs.map((crumb, idx) => {
        const Icon = crumb.icon || (idx === displayCrumbs.length - 1 ? UserSearch : Microscope);
        const isLast = idx === displayCrumbs.length - 1;

        return (
          <React.Fragment key={idx}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all 
                ${isLast ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isLast ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold whitespace-nowrap">{crumb.label}</span>
            </motion.div>
            
            {!isLast && (
              <ChevronRight className="w-3 h-3 text-slate-700" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default InvestigationBreadcrumbs;
