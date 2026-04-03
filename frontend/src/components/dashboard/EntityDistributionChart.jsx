import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function EntityDistributionChart({ data = [], loading = false }) {
  if (loading) return (
    <div className="h-64 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/5 animate-pulse">
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Decoding Network Categories...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col h-full min-h-[320px]"
    >
      <div className="mb-4">
        <h3 className="text-[11px] font-black text-vidzai-emerald uppercase tracking-[0.2em] mb-1">Network Taxonomy</h3>
        <p className="text-[9px] text-slate-500 font-medium">Node distribution by classification</p>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              iconType="circle"
              formatter={(value) => <span className="text-[10px] text-slate-400 font-mono uppercase">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
