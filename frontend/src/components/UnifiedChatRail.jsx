import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader2, Activity, GitBranchPlus, Search, BrainCircuit } from 'lucide-react';
import { kgService } from '../services/apiClient';
import { useIntelStore } from '../store/useIntelStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function UnifiedChatRail() {
  const { selectedElement } = useIntelStore();
  const [messages, setMessages] = useState([
    { id: 1, role: 'agent', content: 'Neural context ready. Ask me about relationships, anomalies, or entities in the current graph.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, thoughtSteps]);

  const handleProbeNode = () => {
    if (selectedElement) {
      const nodeName = selectedElement.properties?.name || selectedElement.properties?.subject || 'Selected Node';
      setInputVal(`Analyze connections for ${nodeName}`);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: inputVal };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);
    
    // Simulate Enterprise Reasoning Steps
    setThoughtSteps(['Initializing GraphRAG...', 'Traversing Semantic Hops...', 'Synthesizing Path Context...']);

    try {
      const res = await kgService.queryRag(userMsg.content);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: res.answer,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: "Operational Error: Intelligence link severed or Backend 500."
      }]);
    }
    setIsProcessing(false);
    setThoughtSteps([]);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
               m.role === 'user' ? 'bg-slate-900 border-white/10' : 'bg-vidzai-emerald/20 border-vidzai-emerald/30'
             }`}>
                {m.role === 'user' ? <User size={14} className="text-slate-500" /> : <Bot size={14} className="text-vidzai-emerald" />}
             </div>
             <div className={`p-4 rounded-2xl text-[13px] leading-relaxed max-w-[85%] ${
               m.role === 'user' 
                ? 'bg-vidzai-emerald text-white rounded-tr-sm font-medium shadow-lg shadow-vidzai-emerald/20' 
                : 'bg-slate-900/60 text-slate-300 rounded-tl-sm border border-white/5 backdrop-blur-md'
             }`}>
                {m.content}
             </div>
          </div>
        ))}
        
        {/* ENHANCED THOUGHT STEPPER */}
        <AnimatePresence>
          {isProcessing && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex gap-3">
                   <div className="size-8 bg-slate-900 rounded-lg flex items-center justify-center border border-white/10">
                      <Loader2 size={12} className="animate-spin text-vidzai-emerald" />
                   </div>
                   <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-dashed border-white/10">
                      <div className="flex flex-col gap-2">
                         {thoughtSteps.map((step, i) => (
                            <motion.div 
                               key={i}
                               initial={{ x: -10, opacity: 0 }}
                               animate={{ x: 0, opacity: 1 }}
                               transition={{ delay: i * 0.4 }}
                               className="flex items-center gap-2 text-[10px] font-mono text-slate-500"
                            >
                               {i === thoughtSteps.length - 1 ? <Activity size={10} className="text-vidzai-emerald animate-pulse" /> : <GitBranchPlus size={10} />}
                               <span>{step}</span>
                            </motion.div>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedElement && (
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
             className="px-5 py-3 bg-vidzai-emerald/5 border-t border-vidzai-emerald/10 flex items-center justify-between"
           >
              <span className="text-[10px] text-vidzai-emerald font-bold uppercase tracking-widest flex items-center gap-2">
                 <BrainCircuit size={12} /> Probe Selected Node
              </span>
              <button onClick={handleProbeNode} className="text-[10px] bg-vidzai-emerald text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-tighter hover:bg-vidzai-emerald/80 transition-all shadow-lg shadow-vidzai-emerald/20">
                 Analyze Path
              </button>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-slate-950/40 border-t border-white/5 backdrop-blur-md">
         <form onSubmit={handleSend} className="relative flex items-center">
            <input 
               type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
               placeholder="Ask Vidzai about relationships..."
               className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 pl-4 pr-12 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-vidzai-emerald/50 transition-all font-medium"
            />
            <button type="submit" disabled={isProcessing || !inputVal.trim()} className="absolute right-2 p-2 text-vidzai-emerald hover:bg-vidzai-emerald/10 rounded-lg transition-all">
               <Send size={18} />
            </button>
         </form>
      </div>
    </div>
  );
}
