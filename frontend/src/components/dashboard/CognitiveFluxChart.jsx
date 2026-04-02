import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Share2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

const CognitiveFluxChart = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Entity Types Pie Chart */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 glass-card h-[400px] flex flex-col border border-white/5"
      >
        <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Activity className="w-4 h-4 text-indigo-400" />
          Entity Distribution
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics?.entity_types || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {(metrics?.entity_types || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Communicators Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 glass-card h-[400px] flex flex-col border border-white/5"
      >
        <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Share2 className="w-4 h-4 text-emerald-400" />
          Top Communicators
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.top_communicators || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar 
                dataKey="value" 
                fill="#6366f1" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              >
                {(metrics?.top_communicators || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default CognitiveFluxChart;
