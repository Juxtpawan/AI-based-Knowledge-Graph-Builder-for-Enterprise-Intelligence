import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Database, Share2, Users, Activity, Loader2, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

const DashboardView = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Metrics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 animate-pulse">Retrieving Knowledge Graph Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Graph Analytics</h2>
          <p className="text-slate-400">Deep insights into Enterprise Intelligence structure</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Entities', value: metrics?.total_entities, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Relationships', value: metrics?.total_relationships, icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Records Processed', value: metrics?.data_info?.processed_records, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Processing Progress', value: `${((metrics?.data_info?.processed_records / metrics?.data_info?.total_records) * 100).toFixed(2)}%`, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 glass-card group hover:bg-white/5 transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} border border-white/5 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entity Types Pie Chart */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="p-6 glass-card h-[400px] flex flex-col"
        >
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            Entity Distribution
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.entity_types}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {metrics?.entity_types.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Communicators Bar Chart */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="p-6 glass-card h-[400px] flex flex-col"
        >
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Top Communicators
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.top_communicators}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                >
                  {metrics?.top_communicators.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Processed Data Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 glass-card"
      >
        <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Database className="w-5 h-5 text-amber-500" />
          </div>
          Knowledge Source Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">Source File</p>
            <p className="text-white font-mono text-lg">{metrics?.data_info?.data_file}</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">Dataset Size</p>
            <p className="text-white text-lg">{metrics?.data_info?.file_size_mb} MB</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">Last Processed</p>
            <p className="text-white text-lg">{metrics?.data_info?.last_updated}</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-300">Extraction Progress</p>
            <p className="text-sm font-bold text-indigo-400">
              {metrics?.data_info?.processed_records} / {metrics?.data_info?.total_records} Records
            </p>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(metrics?.data_info?.processed_records / metrics?.data_info?.total_records) * 100}%` }}
              className="h-full bg-linear-to-r from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardView;
