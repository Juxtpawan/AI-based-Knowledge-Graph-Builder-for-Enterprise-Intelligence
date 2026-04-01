import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, X, FileText, Trash2, Download } from 'lucide-react';
import { useIntelStore } from '../store/useIntelStore';

export default function EvidenceBag() {
  const { evidenceBag, unpinNode, clearEvidenceBag } = useIntelStore();
  const [isOpen, setIsOpen] = useState(false);

  const exportReport = () => {
    if (evidenceBag.length === 0) return;

    let report = `# Forensic Case Report: Investigation Summary\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    report += `## Summary\nTotal Evidence Items: ${evidenceBag.length}\n\n`;
    report += `--- \n\n`;

    evidenceBag.forEach((node, index) => {
      report += `### Item ${index + 1}: ${node.properties?.name || node.properties?.subject || node.id}\n`;
      report += `- **Type**: ${node.labels?.join(', ')}\n`;
      report += `- **Curation Status**: ${node.properties?.curation_status || 'Unverified'}\n`;
      if (node.properties?.curation_status === 'flagged') {
        report += `- **Severity**: ${node.properties?.curation_severity}\n`;
        report += `- **Category**: ${node.properties?.curation_category}\n`;
        report += `- **Notes**: ${node.properties?.curation_note}\n`;
      }
      report += `\n**Detailed Properties:**\n`;
      Object.entries(node.properties || {}).forEach(([key, value]) => {
        if (!['curation_status', 'curation_severity', 'curation_category', 'curation_note', 'curation_status'].includes(key.toLowerCase())) {
          report += `- ${key}: ${value}\n`;
        }
      });
      report += `\n---\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([report], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Forensic_Case_Report_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed left-8 bottom-8 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`size-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl relative ${
          evidenceBag.length > 0 
          ? 'bg-indigo-600 text-white glow-blue' 
          : 'bg-slate-900 text-slate-500 border border-white/5'
        }`}
      >
        <Briefcase size={24} />
        {evidenceBag.length > 0 && (
          <span className="absolute -top-2 -right-2 size-6 rounded-full bg-vidzai-emerald text-[10px] font-black flex items-center justify-center text-slate-950 border-2 border-slate-950 animate-in zoom-in">
            {evidenceBag.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            className="absolute bottom-20 left-0 w-80 vidzai-glass-frame p-6 rounded-3xl shadow-2xl bg-slate-900/95 backdrop-blur-2xl border-white/10"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-indigo-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Evidence Bag</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-3 mb-6">
              {evidenceBag.length > 0 ? (
                evidenceBag.map((node) => (
                  <div key={node.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-indigo-500/30 transition-all">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-200 truncate">{node.properties?.name || node.properties?.subject || node.id}</p>
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">{node.labels?.[0] || 'Unknown'}</p>
                    </div>
                    <button 
                      onClick={() => unpinNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-danger transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-600 opacity-40">
                  <Briefcase size={32} className="mb-3" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Bag is Empty</p>
                </div>
              )}
            </div>

            {evidenceBag.length > 0 && (
              <div className="space-y-3">
                <button 
                  onClick={exportReport}
                  className="w-full py-4 bg-indigo-600 hover:bg-vidzai-emerald text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Download size={14} /> Export Report
                </button>
                <button 
                  onClick={clearEvidenceBag}
                  className="w-full py-3 bg-white/5 hover:bg-danger/10 text-slate-500 hover:text-danger text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Clear Session
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
