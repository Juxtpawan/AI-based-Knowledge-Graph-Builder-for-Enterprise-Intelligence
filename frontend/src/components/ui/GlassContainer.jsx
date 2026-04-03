import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassContainer - Unified Glassmorphism Wrapper
 * Ensures consistent blur, border, and background across the suite.
 */
export default function GlassContainer({
  children,
  className = "",
  animate = true,
  intensity = "medium", // 'low', 'medium', 'heavy'
  hover = false
}) {
  const intensities = {
    low: "bg-slate-900/40 backdrop-blur-md border-white/5",
    medium: "bg-slate-900/60 backdrop-blur-xl border-white/10",
    heavy: "bg-slate-950/80 backdrop-blur-2xl border-white/20 shadow-2xl shadow-black/50"
  };

  const baseClass = `rounded-3xl border transition-all duration-300 ${intensities[intensity]} ${className} ${hover ? 'hover:border-primary/30 hover:bg-slate-900/80' : ''}`;

  if (!animate) {
    return <div className={baseClass}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={baseClass}
    >
      {children}
    </motion.div>
  );
}
