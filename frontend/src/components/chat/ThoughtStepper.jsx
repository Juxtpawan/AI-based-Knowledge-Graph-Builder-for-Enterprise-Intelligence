import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThoughtStepper - Animated RAG Pipeline Visualizer
 * Provides feedback during AI thought synthesis.
 */
export default function ThoughtStepper({ isProcessing, phase }) {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex gap-6 animate-pulse group"
        >
          {/* Status Spinner */}
          <div className="size-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 mt-1 shadow-inner">
            <Loader2 className="animate-spin text-primary" size={18} />
          </div>

          {/* Phase Context */}
          <div className="px-6 py-4 rounded-3xl bg-slate-900/20 border border-white/5 border-dashed text-slate-500 text-[11px] font-mono italic flex items-center gap-3">
            <span className="text-secondary font-bold">SYNT_SYS_v2.1:</span>
            {phase || 'Initializing synthesis engine...'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
