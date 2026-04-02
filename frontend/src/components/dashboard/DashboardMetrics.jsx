import React, { useState, useEffect } from 'react';
import { Database, Share2, Users, Activity, RefreshCcw, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import KpiCard from './KpiCard';

const DashboardMetrics = () => {
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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
        <span className="text-slate-400 font-medium tracking-wide">Syncing Workspace Intelligence...</span>
      </div>
    );
  }

  const stats = [
    { label: 'Total Entities', value: metrics?.total_entities || 0, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Relationships', value: metrics?.total_relationships || 0, icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Records Modeled', value: metrics?.data_info?.processed_records || 0, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Ingestion Flux', value: `${(( (metrics?.data_info?.processed_records || 0) / (metrics?.data_info?.total_records || 1)) * 100).toFixed(1)}%`, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Live Intelligence Flux</h3>
        <button 
          onClick={fetchMetrics}
          className="p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all group"
          title="Refresh Metrics"
        >
          <RefreshCcw className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-active:rotate-180 transition-all duration-500" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <KpiCard key={stat.label} {...stat} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
};

export default DashboardMetrics;
