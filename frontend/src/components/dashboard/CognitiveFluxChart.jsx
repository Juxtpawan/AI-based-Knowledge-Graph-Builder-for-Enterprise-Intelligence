import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FlaskConical } from 'lucide-react';

// Custom dark tooltip for the chart
const ForensicTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[11px] font-bold text-white uppercase tracking-tight">
            {p.name}: {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * CognitiveFluxChart — Real Enron email volume vs. risk chart.
 *
 * Renders an AreaChart showing actual email activity bucketed by day-of-week
 * from the Enron Neo4j database. Volume = all emails, Risk = flagged emails.
 *
 * Props:
 *  - data     (array) — [{name, volume, risk}] from /analytics
 *  - loading  (bool)  — shows skeleton when true
 */
export default function CognitiveFluxChart({ data = [], loading = false }) {
  const [activeTab, setActiveTab] = useState('week');

  const isPopulated = data.some(d => d.volume > 0);

  return (
    <div className="lg:col-span-2 vidzai-glass p-5 sm:p-8 rounded-4xl border border-white/5 bg-slate-900/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-vidzai-emerald/10 rounded-2xl">
            <FlaskConical className="text-vidzai-emerald" size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest leading-none">
              Cognitive Flux
            </h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1.5">
              {isPopulated
                ? 'Email Volume vs. Flagged Risk'
                : 'Loading real graph activity...'}
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-white/5 self-end sm:self-auto">
          {['week', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-[9px] font-bold rounded-lg uppercase tracking-tight transition-all ${activeTab === tab
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-400'
                }`}
            >
              {tab === 'week' ? 'Day' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend badges */}
      <div className="flex items-center gap-6 mb-6 ml-2">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Email Volume
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Flagged Risk
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[260px] min-h-[260px] w-full relative overflow-hidden">
        {loading ? (
          <div className="w-full h-full bg-slate-800/40 animate-pulse rounded-2xl" />
        ) : !isPopulated ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-slate-800 rounded-2xl">
              <FlaskConical size={24} className="text-slate-600" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              No Email nodes with dates found in graph
            </p>
            <p className="text-[10px] text-slate-700 uppercase tracking-wider">
              Import Enron email data to activate this chart
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#475569', fontWeight: 'bold' }}
              />
              <Tooltip content={<ForensicTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                name="Volume"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradVolume)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="risk"
                name="Risk"
                stroke="#ef4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradRisk)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
