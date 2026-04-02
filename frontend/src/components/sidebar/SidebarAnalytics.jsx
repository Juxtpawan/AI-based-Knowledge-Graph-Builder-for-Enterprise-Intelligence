import React from 'react';
import { Activity, Zap, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const SidebarAnalytics = ({ analytics }) => {
  // Mock data for design if none provided
  const data = analytics?.history || [
    { name: '01', value: 30 },
    { name: '02', value: 55 },
    { name: '03', value: 45 },
    { name: '04', value: 80 },
    { name: '05', value: 65 },
    { name: '06', value: 95 }
  ];

  return (
    <div className="p-6 border-b border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Flux Analytics</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500">+12.5%</span>
        </div>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Relational Mass', value: '42.8', icon: BarChart3, color: 'text-indigo-400' },
          { label: 'Temporal Flux', value: '0.92', icon: Zap, color: 'text-amber-400' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <item.icon className={`w-3 h-3 ${item.color} opacity-60`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-white leading-tight">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SidebarAnalytics;
