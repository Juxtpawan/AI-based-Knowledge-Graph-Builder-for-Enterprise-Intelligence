import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Brain, Sparkles, Loader2 } from 'lucide-react';

const ThoughtStepper = ({ isThinking, step = 0 }) => {
  const steps = [
    { id: 0, label: 'Analyzing Intent', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 1, label: 'Graph Traversal', icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 2, label: 'Vector Retrieval', icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 3, label: 'Synthesizing Response', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  ];

  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col gap-4 p-6 glass-card border border-white/5 bg-white/5 rounded-2xl mb-6 relative overflow-hidden"
        >
          {/* Background trace */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2" />
          
          <div className="flex justify-between items-center relative z-10">
            {steps.map((s, i) => {
              const isActive = step >= i;
              const isCurrent = step === i;
              const Icon = s.icon;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-3 group">
                  <motion.div
                    animate={isCurrent ? { 
                      scale: [1, 1.1, 1],
                      boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.3)', '0 0 0px rgba(99,102,241,0)']
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border
                      ${isActive ? `${s.bg} ${s.color} border-white/20` : 'bg-slate-800/50 text-slate-600 border-white/5'}`}
                  >
                    {isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500
                    ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                  
                  {/* Connector */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[1px] bg-white/10 -z-10" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">
              Intelligence system is currently <span className="text-indigo-400 font-bold">{steps[step].label.toLowerCase()}</span>...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThoughtStepper;
