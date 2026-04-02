import React from 'react';
import { User, Building2, Globe, Mail, Fingerprint, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const NodeIdentity = ({ node }) => {
  if (!node) return null;

  const getIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'person': return User;
      case 'organization': return Building2;
      case 'email': return Mail;
      default: return Globe;
    }
  };

  const Icon = getIcon(node.label);
  const typeColor = node.label === 'Person' ? 'text-indigo-400' : 
                    node.label === 'Organization' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="p-6 border-b border-white/5 relative overflow-hidden group">
      {/* Background glow based on type */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10 rounded-full bg-current ${typeColor}`} />
      
      <div className="flex items-start gap-4 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 ${typeColor} shadow-2xl group-hover:scale-105 transition-transform duration-500`}
        >
          <Icon className="w-8 h-8" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>
              {node.label || 'Entity'}
            </span>
            {node.properties?.verified && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white truncate leading-tight tracking-tight">
            {node.properties?.name || node.properties?.subject || 'Unnamed Entity'}
          </h2>
          <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-1 overflow-hidden">
            <Fingerprint className="w-3 h-3 flex-shrink-0" />
            <span className="truncate opacity-60">ID: {node.id || 'N/A'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeIdentity;
