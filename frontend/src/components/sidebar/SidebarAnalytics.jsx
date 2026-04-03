import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis 
} from 'recharts';
import { Activity, Zap, TrendingUp, Users, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../../services/apiClient';

/**
 * SidebarAnalytics - Real-Time Activity Pulse
 * Features live-syncing behavioral metrics for individual nodes.
 */
export default function SidebarAnalytics({ element }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!element || element.isRelationship) return;

    const fetchPulse = async () => {
      try {
        const data = await kgService.getNodePulse(element.id);
        setPulse(data);
        setLoading(false);
      } catch (err) {
        console.error("Pulse sync failed:", err);
      }
    };

    fetchPulse(); // Initial fetch
    const interval = setInterval(fetchPulse, 5000); // Pulse every 5s

    return () => clearInterval(interval);
  }, [element]);

  if (!element || element.isRelationship) return (
    <div className="p-8 text-center bg-slate-900/60 rounded-4xl border border-white/5 backdrop-blur-3xl">
      <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">Select an investigative node to view behavioral pulse</p>
    </div>
  );

  if (loading && !pulse) {
    return (
      <div className="space-y-6 bg-slate-900/60 p-6 rounded-4xl border border-white/5 animate-pulse">
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-64 bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Activity distribution derived from real metrics
  const activityData = [
    { name: 'Velocity', value: (pulse.interaction_velocity * 20), color: '#10b981' },
    { name: 'Momentum', value: Math.abs(pulse.influence_momentum), color: '#6366f1' },
    { name: 'Burstiness', value: (pulse.burst_pattern * 100), color: '#f59e0b' }
  ];

  // Sparkline data mapping
  const sparkData = pulse.burst_series.map((val, i) => ({ time: i, val }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      {/* 1. Main Behavioral Circle */}
      <div className="bg-slate-900/60 p-6 rounded-4xl border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} className="text-vidzai-emerald animate-pulse" /> Activity Pulse
          </h4>
          <div className="flex items-center gap-2 px-3 py-1 bg-vidzai-emerald/10 rounded-lg border border-vidzai-emerald/20">
            <div className="size-1.5 rounded-full bg-vidzai-emerald animate-ping" />
            <span className="text-[9px] font-bold text-vidzai-emerald tracking-widest uppercase">Live Link</span>
          </div>
        </div>

        <div className="h-64 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activityData}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={10}
                dataKey="value"
                stroke="none"
              >
                {activityData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span 
                key={pulse.risk_coefficient}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-white tracking-widest leading-none"
              >
                {pulse.risk_coefficient}%
              </motion.span>
            </AnimatePresence>
            <span className="text-[8px] text-slate-600 font-bold uppercase mt-1">Risk Coeff</span>
          </div>
        </div>

        {/* Forensic Scorecards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-1 group">
            <div className="flex items-center gap-2">
              <Zap size={10} className="text-emerald-500" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Velocity</span>
            </div>
            <p className="text-sm font-black text-white font-mono">{pulse.interaction_velocity}x</p>
          </div>
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-1 group">
            <div className="flex items-center gap-2">
              <TrendingUp size={10} className="text-primary" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Momentum</span>
            </div>
            <p className="text-sm font-black text-white font-mono">{pulse.influence_momentum > 0 ? '+' : ''}{pulse.influence_momentum}%</p>
          </div>
        </div>
      </div>

      {/* 2. Traffic Burst Trend (Sparkline) */}
      <div className="bg-slate-900/60 p-6 rounded-4xl border border-white/5 backdrop-blur-3xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Target size={14} className="text-amber-500" /> Interaction Burst Pattern
        </h4>
        <div className="h-20 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={sparkData}>
               <defs>
                 <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area 
                type="monotone" 
                dataKey="val" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorVal)" 
                strokeWidth={2}
               />
             </AreaChart>
           </ResponsiveContainer>
        </div>
        <p className="text-[8px] text-slate-600 font-bold uppercase mt-4 tracking-widest text-center">
            Recent Temporal Clustering Score: <span className="text-amber-500">{pulse.burst_pattern}</span>
        </p>
      </div>

      {/* 3. Top Live Interactors */}
      <div className="bg-slate-900/60 p-6 rounded-4xl border border-white/5 backdrop-blur-3xl">
         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Users size={14} className="text-vidzai-emerald" /> Primary Counterparties
         </h4>
         <div className="space-y-3">
            {pulse.top_interactors.map((interactor, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-vidzai-emerald/20 transition-all cursor-crosshair group">
                 <div className="flex items-center gap-3">
                    <div className="size-1.5 rounded-full bg-slate-800 group-hover:bg-vidzai-emerald transition-colors" />
                    <span className="text-[10px] font-black text-slate-300 uppercase truncate max-w-[120px]">{interactor.name}</span>
                 </div>
                 <span className="text-[9px] font-mono text-slate-600">{interactor.value} INTEL</span>
              </div>
            ))}
         </div>
      </div>
    </motion.div>
  );
}
