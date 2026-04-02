import React from 'react';
import { motion } from 'framer-motion';

const GlassContainer = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl ${className}`}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-white/5 to-transparent" />
      
      {/* Dynamic light trace in the corner */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full" />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassContainer;
