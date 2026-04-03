import React from 'react';
import { Database, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

import { useAnalytics } from './useAnalytics';
import KpiCard from './KpiCard';
import CognitiveFluxChart from './CognitiveFluxChart';
import AlertFabric from './AlertFabric';



const KPI_CONFIG = [
  {
    key: 'intelligenceLinks',
    label: 'Intelligence Links',
    icon: Database,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    sublabel: 'MATCH ()-[r]->() · total relationships',
  },
  {
    key: 'forensicVelocity',
    label: 'Forensic Velocity',
    icon: TrendingUp,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    sublabel: 'V = (2·E/V) / 20 · avg degree normalized',
  },
  {
    key: 'anomalyScore',
    label: 'Anomaly Score',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    sublabel: 'S = (flagged / total) × 10 · risk saturation',
  },
  {
    key: 'neuralUptime',
    label: 'Neural Uptime',
    icon: Activity,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    sublabel: 'Live server uptime since last restart',
  },
];

export default function DashboardMetrics() {
  const { kpis, chartData, alerts, isLoading } = useAnalytics();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 font-sans">

      {/* 1. KPI Matrix (4 cards)*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {KPI_CONFIG.map((cfg, idx) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={kpis[cfg.key]}
            icon={cfg.icon}
            color={cfg.color}
            bg={cfg.bg}
            sublabel={cfg.sublabel}
            loading={isLoading}
            index={idx}
          />
        ))}
      </div>

      {/* 2. Chart + Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Cognitive Flux Area Chart (real Enron data) */}
        <CognitiveFluxChart data={chartData} loading={isLoading} />

        {/* Alert Fabric (live flagged elements feed) */}
        <AlertFabric alerts={alerts} loading={isLoading} />

      </div>
    </div>
  );
}
