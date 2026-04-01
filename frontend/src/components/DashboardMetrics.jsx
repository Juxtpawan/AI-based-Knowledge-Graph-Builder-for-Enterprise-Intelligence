import React, { useState, useEffect } from 'react';
import { kgService } from '../services/apiClient';
import { 
  Users, 
  Database, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  FileText, 
  Server,
  Activity,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricData, alertData] = await Promise.all([
          kgService.getMetrics(),
          kgService.getAlerts()
        ]);
        setMetrics(metricData);
        setAlerts(alertData);
      } catch (err) {
        console.error('Data Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-900/40 border border-white/5 rounded-2xl" />)}
     </div>
  );

  const stats = [
    { label: 'Entities', value: metrics?.total_entities || 0, icon: Users, color: 'text-vidzai-emerald', bg: 'bg-vidzai-emerald/10' },
    { label: 'Relationships', value: metrics?.total_relationships || 0, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Size', value: `${metrics?.data_info?.file_size_mb || 0} MB`, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Processed Records', value: metrics?.data_info?.processed_records || 0, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="space-y-10">
      
      {/* 1. KEY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="vidzai-glass-frame p-6 rounded-2xl group hover:vidzai-neon-glow transition-all"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${s.bg} ${s.color} border border-current/20`}>
                     <s.icon size={20} />
                  </div>
                  <TrendingUp size={16} className="text-vidzai-emerald opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               <h4 className="text-2xl font-black tracking-tighter text-white mb-1">
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
               </h4>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 2. ENTERPRISE ALERTS (Anomalies) */}
         <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <ShieldAlert size={18} className="text-danger glow-danger" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white italic">Intelligence Alerts</h3>
            </div>
             <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert, i) => (
                    <div key={i} className="vidzai-glass-frame p-4 rounded-xl border-white/5 flex gap-4 items-center bg-slate-950/40 group cursor-pointer hover:bg-slate-900/60 transition-all">
                       <div className={`size-2 rounded-full ${
                          alert.severity === 'Critical' ? 'bg-danger animate-pulse glow-danger' : 
                          alert.severity === 'High' ? 'bg-amber-600' : 'bg-slate-500'
                       }`} />
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">{alert.title}</h4>
                             <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-500 font-mono italic">{alert.category}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium italic truncate max-w-[200px]">{alert.detail || "No investigator notes provided."}</p>
                       </div>
                       <AlertCircle size={14} className="text-slate-700 group-hover:text-amber-500 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="vidzai-glass-frame p-8 rounded-xl border-dashed border-white/5 flex flex-col items-center justify-center opacity-40">
                     <ShieldAlert size={24} className="mb-3 text-slate-600" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No active threats detected</p>
                  </div>
                )}
             </div>
            <button className="w-full py-4 vidzai-glass-frame border-dashed border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:border-vidzai-emerald/40 transition-all">
               Run Deep Audit Scan
            </button>
         </div>

         {/* 3. ENTITY DISTRIBUTION (Chart) */}
         <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <Activity size={18} className="text-vidzai-emerald" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white italic">Structural Distribution</h3>
               </div>
               <div className="flex gap-2">
                  <div className="size-2 bg-vidzai-emerald rounded-full" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest">Live Sync</span>
               </div>
            </div>
            <div className="h-[320px] w-full vidzai-glass-frame p-6 rounded-3xl bg-slate-950/40 border-white/5 overflow-hidden">
                <ResponsiveContainer width="99%" height="100%" minHeight={300}>
                  <BarChart data={metrics?.entity_types || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} 
                       dy={10}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                       cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} 
                       contentStyle={{ background: '#0a0a0a', border: '1px solid #10b981', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                       {(metrics?.entity_types || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} fillOpacity={0.8} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

      </div>
    </div>
  );
}
