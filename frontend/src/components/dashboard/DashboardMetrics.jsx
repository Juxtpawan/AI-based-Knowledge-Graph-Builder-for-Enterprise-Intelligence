import React from 'react';
import { Database, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

import { useRealtimeAnalytics } from '../../services/useRealtimeAnalytics';
import { useIntelStore } from '../../store/useIntelStore';
import { useNavigate } from 'react-router-dom';
import { kgService } from '../../services/apiClient';
import KpiCard from './KpiCard';
import CognitiveFluxChart from './CognitiveFluxChart';
import AlertFabric from './AlertFabric';
import EntityDistributionChart from './EntityDistributionChart';
import TopCommunicatorsChart from './TopCommunicatorsChart';
import ProcessingStatus from './ProcessingStatus';

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
    key: 'forensic_velocity',
    label: 'Forensic Velocity',
    icon: TrendingUp,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    sublabel: 'V = (2·E/V) / 20 · avg degree normalized',
  },
  {
    key: 'anomaly_score',
    label: 'Anomaly Score',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    sublabel: 'S = (flagged / total) × 10 · risk saturation',
  },
  {
    key: 'neural_uptime',
    label: 'Neural Uptime',
    icon: Activity,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    sublabel: 'Live server uptime since last restart',
  },
];

export default function DashboardMetrics() {
  const { 
    kpis, 
    chartData, 
    entityBreakdown, 
    topCommunicators, 
    processingInfo,
    alerts, 
    isLoading, 
    isLive,
    removeAlert
  } = useRealtimeAnalytics();

  const setSelectedElement = useIntelStore(s => s.setSelectedElement);
  const navigate = useNavigate();

  const handleAlertSelect = (alert) => {
    // Set the element in the global store so NetworkView can highlight it
    setSelectedElement({
        id: alert.element_id,
        isNode: alert.is_node,
        isRelationship: !alert.is_node,
        name: alert.title.split(': ')[1], // Extract name from title
        initialTab: 'forensics' // Tell Sidebar to open Curation tab directly
    });
    // Redirect to the Grapg view
    navigate('/explore');
  };

  const handleAlertDelete = async (alert) => {
    try {
        // 1. Optimistically remove from UI for instant feedback
        removeAlert(alert.element_id);
        
        // 2. Tell backend to neutralize the flag
        await kgService.curateElement({
            element_id: alert.element_id, 
            is_node: alert.is_node, 
            status: 'neutral',
            severity: 'Low',
            category: 'Verified',
            note: 'Cleared from dashboard'
        });
    } catch (err) {
        console.error("Failed to neutralize alert:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 font-sans">

      {/* 1. KPI Matrix (4 cards)*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* 2. Middle Grid: Ingestion + Taxonomy + Interaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
         <ProcessingStatus 
            total={processingInfo.total}
            processed={processingInfo.processed}
            percentage={processingInfo.percentage}
            loading={isLoading}
            isLive={isLive}
         />
         <EntityDistributionChart data={entityBreakdown} loading={isLoading} />
         <TopCommunicatorsChart data={topCommunicators} loading={isLoading} />
      </div>

      {/* 3. Bottom Row: Flux + Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CognitiveFluxChart data={chartData} loading={isLoading} />
        <AlertFabric 
            alerts={alerts} 
            loading={isLoading} 
            onSelect={handleAlertSelect}
            onDelete={handleAlertDelete}
        />
      </div>

    </div>
  );
}
