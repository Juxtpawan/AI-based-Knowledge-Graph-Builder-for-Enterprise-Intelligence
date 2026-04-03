import React from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const CustomBarLabel = ({ x, y, width, height, value }) => {
  return (
    <text x={x + width / 2} y={y - 12} fill="#64748b" textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-mono font-bold uppercase tracking-tighter">
      {Math.round(value)}
    </text>
  );
};

export default function TopCommunicatorsChart({ data = [], loading = false }) {
    if (loading) return (
      <div className="h-64 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/5 animate-pulse">
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Mapping Intelligence Nodes...</p>
      </div>
    );
  
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col h-full min-h-[320px]"
      >
        <div className="mb-4">
          <h3 className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em] mb-1">Interaction Heat</h3>
          <p className="text-[9px] text-slate-500 font-medium">Top active entities by relationship volume</p>
        </div>
  
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontFamily: 'monospace'
                }}
                itemStyle={{ color: '#0ea5e9' }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                barSize={12}
                animationDuration={2000}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`rgba(14, 165, 233, ${1 - (index * 0.1)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  }
