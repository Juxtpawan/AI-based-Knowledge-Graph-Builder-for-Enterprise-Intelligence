import React from 'react';
import { Shield, Flag, Trash2, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarForensics = ({ node, onAction }) => {
  const actions = [
    { id: 'verify', label: 'Verify Entity', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Mark as organizationally valid' },
    { id: 'flag', label: 'Flag Analysis', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', description: 'Mark for manual deeper review' },
    { id: 'prune', label: 'Prune Node', icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10', description: 'Isolate from active graph scan' }
  ];

  return (
    <div className="p-6 border-b border-white/5 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-400" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Forensic Controls</h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onAction(action.id)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group text-left relative overflow-hidden"
          >
            {/* Hover ripple effect */}
            <div className={`absolute -inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${action.bg} -z-10`} />
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-500 flex-shrink-0 shadow-lg shadow-black/20`}>
              <action.icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">
                {action.label}
              </p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors font-medium">
                {action.description}
              </p>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Shield className="w-4 h-4 text-indigo-500/30" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-amber-500/70 leading-relaxed font-semibold italic">
          Audit Logging is active. These actions will be recorded in the organizational intelligence ledger.
        </p>
      </div>
    </div>
  );
};

export default SidebarForensics;
