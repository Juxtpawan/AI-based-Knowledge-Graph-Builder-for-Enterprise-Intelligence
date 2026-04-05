import React from 'react';
import { FileText, ArrowRightLeft, Layers, Shield, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * SidebarMetadata - Forensic Dossier Explorer
 */
export default function SidebarMetadata({ element }) {
  if (!element) return null;
  const isNode = !element.isRelationship;
  const props = element.properties || {};

  // Forensic Identity Archetypes (Synced with miles2neo4j_storage.ipynb)
  const identityKeys = [
    'name', 'email', 'subject', 'role', 'category', 'entity_type', 'job_title', 'department', 
    'employee_id', 'message_id', 'date', 'weekday', 'time_category',
    'from_email', 'to_emails', 'sender_name', 'communication_type'
  ];
  
  // High-Signal Behavioral Metrics
  const behavioralKeys = [
    'sentiment', 'risk_score', 'curation_status', 
    'sent_count', 'received_count', 'frequency',
    'sent_to_unique', 'received_from_unique', 
    'internal_sent', 'external_sent', 'total_unique_contacts',
    'avg_word_count', 'diversity_score', 'word_count', 'email_length',
    'first_contact', 'last_contact', 'timestamp'
  ];

  const identityProps = Object.entries(props).filter(([k]) => identityKeys.includes(k.toLowerCase()));
  const behavioralProps = Object.entries(props).filter(([k]) => behavioralKeys.some(b => k.toLowerCase().includes(b)));
  const otherProps = Object.entries(props).filter(([k]) =>
    !identityKeys.includes(k.toLowerCase()) &&
    !behavioralKeys.some(b => k.toLowerCase().includes(b))
  );

  const PropertyCard = ({ k, v, icon: Icon = Layers, highlight = false }) => (
    <div className={`group p-4 rounded-2xl border transition-all duration-300 ${highlight
        ? 'bg-vidzai-emerald/5 border-vidzai-emerald/20 hover:border-vidzai-emerald/40'
        : 'bg-slate-900/40 border-white/5 hover:border-white/10'
      }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[8px] font-black uppercase tracking-widest ${highlight ? 'text-vidzai-emerald' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
          {k.replace(/_/g, ' ')}
        </span>
        <Icon size={10} className={highlight ? 'text-vidzai-emerald' : 'text-slate-800'} />
      </div>
      <span className={`text-xs block truncate font-mono ${highlight ? 'text-white font-bold' : 'text-slate-200'}`} title={String(v)}>
        {String(v)}
      </span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">

      {/* 1. LINK CONTINUITY */}
      {!isNode && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <ArrowRightLeft size={14} className="text-amber-500" /> Link Protocol
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="vidzai-glass p-5 rounded-3xl border-white/5 bg-slate-900/60 shadow-xl">
              <span className="text-[7px] text-slate-700 font-black uppercase block mb-2 tracking-tighter">Sender</span>
              <span className="text-[10px] text-white font-mono break-all leading-tight">
                {element.from_name || element.from}
              </span>
            </div>
            <div className="vidzai-glass p-5 rounded-3xl border-white/5 bg-slate-900/60 shadow-xl">
              <span className="text-[7px] text-slate-700 font-black uppercase block mb-2 tracking-tighter">Recipient</span>
              <span className="text-[10px] text-white font-mono break-all leading-tight">
                {element.to_name || element.to}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ESSENTIAL IDENTITY */}
      {identityProps.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield size={14} className="text-primary" /> Identity Markers
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {identityProps.map(([k, v], i) => <PropertyCard key={i} k={k} v={v} icon={Globe} highlight={true} />)}
          </div>
        </div>
      )}

      {/* 3. BEHAVIORAL ANALYTICS */}
      {behavioralProps.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Intelligence Signal
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {behavioralProps.map(([k, v], i) => <PropertyCard key={i} k={k} v={v} icon={Zap} />)}
          </div>
        </div>
      )}

      {/* 4. EXTENDED METADATA */}
      {otherProps.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={14} className="text-slate-600" /> Extended Intel
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {otherProps.map(([k, v], i) => <PropertyCard key={i} k={k} v={v} />)}
          </div>
        </div>
      )}

    </motion.div>
  );
}
