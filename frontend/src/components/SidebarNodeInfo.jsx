import React, { useState } from 'react';
import { User, Tag, Link2, Info, ThumbsUp, ThumbsDown, Trash2, BarChart3, TrendingUp, Download, Share2, ShieldCheck, Database, AlertCircle, Pin } from 'lucide-react';
import { useIntelStore } from '../store/useIntelStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';

export default function SidebarNodeInfo({ element }) {
  const [feedback, setFeedback] = useState(element?.properties?.curation_status || null);
  const [isCurationLoading, setIsCurationLoading] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagData, setFlagData] = useState({
    severity: 'Medium',
    category: 'Communication Spike',
    note: ''
  });

  const { evidenceBag, pinNode, unpinNode } = useIntelStore();
  const isPinned = element && evidenceBag.some(n => n.id === element.id);

  if (!element) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-600 h-full opacity-40">
          <div className="size-20 rounded-4xl border border-slate-800 flex items-center justify-center mb-6 border-dashed animate-pulse-slow bg-slate-900/20">
           <Database size={28} className="opacity-30" />
        </div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-center leading-loose">Neural Link Instance <br/> Waiting for Node Probe</p>
      </div>
    );
  }

  const isNode = element.labels !== undefined;
  const isEmployee = isNode && element.labels.includes('Employee');
  
  const handleCurate = async (status) => {
    setIsCurationLoading(true);
    try {
      await kgService.curateElement({
        element_id: element.id,
        is_node: isNode,
        status,
        severity: status === 'flagged' ? flagData.severity : 'Low',
        category: status === 'flagged' ? flagData.category : 'None',
        note: status === 'flagged' ? flagData.note : ''
      });
      setFeedback(status);
      setShowFlagForm(false);
    } catch (err) {
      alert("Curation failed. Ensure backend is running.");
    } finally {
      setIsCurationLoading(false);
    }
  };

  const handlePrune = async () => {
    if (!window.confirm("Prune this from the Knowledge Graph permanently?")) return;
    setIsCurationLoading(true);
    try {
      await kgService.pruneElement(element.id, isNode);
      window.location.reload(); // Refresh to update graph
    } catch (err) {
      alert("Pruning failed.");
    } finally {
      setIsCurationLoading(false);
    }
  };

  const exportKnowledge = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(element, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `intel_node_${element.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  let chartData = [];
  if (isEmployee && element.properties) {
    chartData = [
      { name: 'Sent', count: element.properties.sent_count || 0, color: '#6366f1' },
      { name: 'Received', count: element.properties.received_count || 0, color: '#10b981' },
      { name: 'Internal', count: element.properties.internal_sent || 0, color: '#0ea5e9' },
      { name: 'External', count: element.properties.external_sent || 0, color: '#ef4444' },
      { name: 'Unique', count: element.properties.total_unique_contacts || 0, color: '#8b5cf6' }
    ].filter(item => item.count > 0);
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-5 custom-scrollbar overflow-y-auto">
      
      {/* AUDIT STATUS BANNER */}
      {feedback && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className={`mb-6 p-3 rounded-xl border flex items-center gap-3 ${
            feedback === 'verified' 
            ? 'bg-vidzai-emerald/10 border-vidzai-emerald/20 text-vidzai-emerald' 
            : 'bg-danger/10 border-danger/20 text-danger animate-pulse'
          }`}
        >
          {feedback === 'verified' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {feedback === 'verified' ? 'Topological Match Verified' : `Anomaly Flagged: ${element.properties?.curation_category || flagData.category}`}
          </span>
        </motion.div>
      )}

      {/* IDENTITY BRANDING */}
      <div className="mb-6 flex items-start gap-5">
         <div className={`p-4 rounded-3xl border shadow-2xl transition-all duration-500 scale-110 ${
           isNode 
             ? (isEmployee ? 'bg-primary/10 border-primary/30 text-primary glow-blue' : 'bg-accent/10 border-accent/30 text-accent glow-emerald')
             : 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-amber-500/10'
         }`}>
            {isNode ? (
               isEmployee ? <User size={24} /> : <Tag size={24} />
            ) : (
               <Link2 size={24} />
            )}
         </div>
         <div className="flex-1">
            <h3 className="font-bold text-white text-xl leading-tight font-display tracking-tight mb-1.5">
               {isNode ? (element.properties?.name || element.properties?.subject || element.id) : element.type}
            </h3>
            <div className="flex items-center gap-2">
                <div className={`size-1.5 rounded-full ${isNode ? 'bg-primary' : 'bg-amber-500'}`} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                    {isNode ? (
                      [
                        element.labels[0], 
                        element.properties?.entity_type || element.properties?.role || element.properties?.job_title 
                      ].filter(Boolean).join(' • ')
                    ) : (
                      `Relationship • ${element.type || 'Direct'}`
                    )}
                </span>
            </div>
         </div>
      </div>

      {/* ACTION TOOLBAR */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
         <button 
            onClick={exportKnowledge}
            className="flex-1 py-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-xl"
         >
            <Download size={14} /> Export Node
         </button>
         <button 
            onClick={() => isPinned ? unpinNode(element.id) : pinNode(element)}
            className={`p-3 rounded-2xl transition-all shadow-xl border ${
              isPinned 
              ? 'bg-vidzai-emerald/20 border-vidzai-emerald text-vidzai-emerald shadow-vidzai-emerald/10' 
              : 'bg-slate-900/50 hover:bg-slate-800 border-white/5 text-slate-400 hover:text-white'
            }`}
            title={isPinned ? "Remove from Evidence Bag" : "Pin to Evidence Bag"}
         >
            <Pin size={16} className={isPinned ? 'fill-current' : ''} />
         </button>
      </div>

      {/* METRICS MODULE */}
      {isEmployee && chartData.length > 0 && (
        <div className="mb-12">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={14} className="text-primary" /> Behavorial Analytics
              </h4>
           </div>
           <div className="h-40 w-full glass-panel rounded-[24px] p-2 bg-slate-950/20 overflow-x-auto!">
              <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                        ))}
                    </Bar>
                    <Tooltip 
                       contentStyle={{ 
                           backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                           backdropFilter: 'blur(8px)',
                           border: '1px solid rgba(255,255,255,0.1)', 
                           borderRadius: '12px',
                           padding: '12px',
                           color: '#f8fafc', 
                           fontSize: '11px',
                           boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                       }}
                       cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                       formatter={(value, name, props) => [
                           <span className="font-bold text-white">{value}</span>, 
                           <span className="uppercase tracking-widest text-slate-500 mr-2">{props.payload.name}</span>
                       ]}
                    />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* PROPERTIES SECTION */}
      <div className="mb-12 flex-1">
         <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={14} className="text-accent" /> Intelligence Metadata
         </h4>
         <div className="space-y-6">
           {element.properties && Object.keys(element.properties).length > 0 ? (
             Object.entries(element.properties).map(([key, value]) => (
               <div key={key} className="flex flex-col gap-1.5 group border-l border-white/5 pl-5 hover:border-primary/50 transition-colors">
                 <span className="text-[10px] text-slate-600 font-mono uppercase font-bold tracking-widest group-hover:text-primary transition-colors">{key}</span>
                 <span className="text-sm text-slate-300 wrap-break-word font-medium leading-relaxed">{value.toString()}</span>
               </div>
             ))
           ) : (
             <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">No direct markers detected</span>
             </div>
           )}
         </div>
      </div>

      {/* CURATION INTELLIGENCE */}
      <div className="mt-auto pt-10 border-t border-white/5 bg-slate-950/20 -mx-5 px-5">
        <div className="flex items-center gap-2 mb-4">
           <ShieldCheck size={14} className="text-vidzai-emerald" />
           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forensic Protocol</h4>
        </div>
        
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => handleCurate('verified')}
                disabled={isCurationLoading}
                className={`flex-1 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                   feedback === 'verified' 
                   ? 'bg-vidzai-emerald/20 border-vidzai-emerald text-vidzai-emerald shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                   : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {isCurationLoading ? "..." : "Verify Intelligence"}
              </button>
              <button 
                onClick={() => setShowFlagForm(!showFlagForm)}
                disabled={isCurationLoading}
                className={`flex-1 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                   feedback === 'flagged' || showFlagForm
                   ? 'bg-danger/20 border-danger text-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                   : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                Flag Anomaly
              </button>
           </div>

           <AnimatePresence>
              {showFlagForm && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="vidzai-glass-frame p-4 rounded-xl space-y-4 border-danger/20"
                >
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[8px] uppercase font-bold text-slate-500 ml-1">Severity</label>
                         <select 
                            value={flagData.severity}
                            onChange={(e) => setFlagData({...flagData, severity: e.target.value})}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-danger/50"
                         >
                            <option>Critical</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] uppercase font-bold text-slate-500 ml-1">Category</label>
                         <select 
                            value={flagData.category}
                            onChange={(e) => setFlagData({...flagData, category: e.target.value})}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-danger/50"
                         >
                            <option>Off-balance Sheet</option>
                            <option>Communication Spike</option>
                            <option>Insider Signal</option>
                            <option>Policy Violation</option>
                         </select>
                      </div>
                   </div>
                   <textarea 
                      placeholder="Enter forensic notes..."
                      value={flagData.note}
                      onChange={(e) => setFlagData({...flagData, note: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-[10px] text-slate-300 h-20 focus:outline-none focus:border-danger/50 resize-none"
                   />
                   <button 
                      onClick={() => handleCurate('flagged')}
                      className="w-full py-3 bg-danger text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-danger/80 transition-all"
                   >
                      Confirm Flag
                   </button>
                </motion.div>
              )}
           </AnimatePresence>

           <button 
             onClick={handlePrune}
             className="w-full mt-4 group flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-950 border border-danger/10 text-danger/40 text-[9px] font-bold uppercase tracking-widest hover:bg-danger/5 hover:border-danger hover:text-danger transition-all duration-500"
           >
             <Trash2 size={12} className="group-hover:rotate-12 transition-transform" /> Prune Element
           </button>
        </div>
      </div>

    </div>
  );
}
