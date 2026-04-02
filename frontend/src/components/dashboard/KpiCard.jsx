import React from 'react';
import { motion } from 'framer-motion';

const KpiCard = ({ label, value, icon: Icon, color, bg, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 glass-card group hover:bg-white/5 transition-all cursor-default border border-white/5 hover:border-white/10"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bg} border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
      
      {/* Subtle background glow on hover */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full ${bg}`} />
    </motion.div>
  );
};

export default KpiCard;
