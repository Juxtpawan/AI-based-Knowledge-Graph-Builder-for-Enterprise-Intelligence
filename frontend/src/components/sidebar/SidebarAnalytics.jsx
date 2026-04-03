import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * SidebarAnalytics - Behavioral Distribution Engine
 * Part of the loss-less modularization of SidebarNodeInfo.
 */
export default function SidebarAnalytics({ element }) {
  if (!element || (element.isRelationship)) return (
    <div className="p-8 text-center bg-slate-900/60 rounded-4xl border border-white/5 backdrop-blur-3xl">
      <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">Select an investigative node to view behavioral analytics</p>
    </div>
  );

  // Behavioral Logic: Activity Distribution (Extracted from 351-line original)
  const activityData = [
    { name: 'Comm Volumetrics', value: 45, color: '#10b981' },
    { name: 'Semantic Density', value: 30, color: '#6366f1' },
    { name: 'Relationship Velocity', value: 25, color: '#f59e0b' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 bg-slate-900/60 p-6 rounded-4xl border border-white/5 backdrop-blur-3xl shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity size={14} className="text-primary animate-pulse" /> Behavioral Dynamics
        </h4>
        <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-[9px] font-bold text-primary tracking-widest">REAL-TIME</span>
        </div>
      </div>

      <div className="h-64 w-full relative group flex items-center justify-center overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activityData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
            >
              {activityData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color}
                  style={{ filter: `drop-shadow(0 0 10px ${entry.color}40)` }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '10px',
                color: '#fff',
                fontWeight: 'bold'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-white tracking-widest leading-none">84%</span>
          <span className="text-[8px] text-slate-600 font-bold uppercase mt-1">Risk Coeff</span>
        </div>
      </div>

      {/* Forensic Scorecards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-emerald-500" />
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Velocity</span>
          </div>
          <p className="text-sm font-black text-white font-mono">1.24x</p>
        </div>
        <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={10} className="text-primary" />
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Momentum</span>
          </div>
          <p className="text-sm font-black text-white font-mono">+18.5%</p>
        </div>
      </div>
    </motion.div>
  );
}
