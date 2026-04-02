import React from 'react';

const StatusIndicator = ({ status, label }) => {
  const getStatusCore = (s) => {
    switch (s?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'healthy':
        return { color: 'bg-emerald-500', pulse: 'bg-emerald-500/40', text: 'text-emerald-400' };
      case 'busy':
      case 'processing':
        return { color: 'bg-indigo-500', pulse: 'bg-indigo-500/40', text: 'text-indigo-400' };
      case 'warning':
      case 'degraded':
        return { color: 'bg-amber-500', pulse: 'bg-amber-500/40', text: 'text-amber-400' };
      default:
        return { color: 'bg-slate-500', pulse: 'bg-slate-500/40', text: 'text-slate-400' };
    }
  };

  const config = getStatusCore(status);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-inner">
      <div className="relative flex items-center justify-center w-2 h-2">
        <div className={`absolute inset-0 rounded-full animate-ping ${config.pulse}`} />
        <div className={`relative w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)] ${config.color}`} />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${config.text}`}>
        {label || status}
      </span>
    </div>
  );
};

export default StatusIndicator;
