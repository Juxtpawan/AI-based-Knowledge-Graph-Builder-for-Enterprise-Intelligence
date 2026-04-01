import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Network, Loader2, Sparkles, ChevronRight, LayoutGrid, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';

export default function RagAgentChat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', content: 'Connection Established: Intel_Fabric_Core' },
    { id: 2, role: 'agent', content: 'Neural context synchronized with Neo4j & Vector Space. I am ready to investigate the Enron metadata corpus. What is our objective today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepperPhase, setStepperPhase] = useState(null);
  const [isSubgraphOpen, setIsSubgraphOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const simulateThoughtProcess = async () => {
    const phases = [
      'Extracting semantic embeddings...',
      'Traversing structural Neo4j triplets...',
      'Synthesizing hybrid intelligence...'
    ];
    for (const phase of phases) {
      setStepperPhase(phase);
      await new Promise(r => setTimeout(r, 800));
    }
    setStepperPhase(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: inputVal };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    try {
      const [response] = await Promise.all([
        kgService.queryRag(userMsg.content),
        simulateThoughtProcess()
      ]);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: response.answer,
        citations: response.citations || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: "Operational Error: Intelligence link severed. Verify backend stability."
      }]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-full p-4 lg:p-8 gap-6 bg-slate-950 relative overflow-hidden">
      
      {/* 1. MAIN CHAT INTERFACE */}
      <div className="flex-1 flex flex-col glass-panel rounded-[2rem] overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-slate-950/40 flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
                  <Bot className="text-primary" size={24} />
               </div>
               <div>
                 <h2 className="text-lg font-bold font-display text-white tracking-tight">Agentic Intelligence</h2>
                 <div className="flex items-center gap-2 mt-0.5">
                    <div className="size-1.5 bg-emerald-500 rounded-full glow-emerald animate-pulse" />
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] font-bold">HybridRAG Intelligence</p>
                 </div>
               </div>
            </div>
            <button 
                onClick={() => setIsSubgraphOpen(!isSubgraphOpen)}
                className="xl:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
            >
                <LayoutGrid size={20} />
            </button>
        </div>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
                if (m.role === 'system') {
                    return (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            key={m.id} 
                            className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.4em] py-6"
                        >
                            {m.content}
                        </motion.div>
                    );
                }
                return (
                <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-2xl border ${
                        m.role === 'user' 
                            ? 'bg-slate-950 border-white/10 text-slate-400' 
                            : 'bg-primary/20 border-primary/20 text-primary'
                    }`}>
                        {m.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                    </div>
                    
                    <div className={`group relative p-6 rounded-[2rem] max-w-[85%] lg:max-w-[75%] text-[15px] leading-relaxed shadow-2xl ${
                        m.role === 'user' 
                            ? 'bg-primary text-white rounded-tr-sm font-medium' 
                            : 'bg-slate-900/40 text-slate-200 rounded-tl-sm border border-white/5 backdrop-blur-md'
                    }`}>
                        {m.content}
                        
                        {m.role === 'agent' && m.id > 2 && (
                        <div className="mt-8 pt-5 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={12} className="text-secondary" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Graph Intelligence Citations</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[11px] bg-slate-950/80 px-4 py-2 rounded-xl border border-white/5 text-primary cursor-pointer hover:border-primary/50 hover:bg-primary/5 flex items-center gap-2.5 transition-all shadow-xl">
                                    <Network size={12} />
                                    <span className="font-medium">Fact_Node #4421: Entity_Sync</span>
                                    <ChevronRight size={10} className="text-slate-700" />
                                </span>
                            </div>
                        </div>
                        )}
                    </div>
                </motion.div>
                );
            })}
          </AnimatePresence>

          {/* Dynamic Thought Stepper Overlay */}
          {isProcessing && (
            <div className="flex gap-6 animate-pulse">
               <div className="size-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 mt-1">
                  <Loader2 className="animate-spin text-primary" size={18} />
               </div>
               <div className="px-6 py-4 rounded-3xl bg-slate-900/20 border border-white/5 border-dashed text-slate-500 text-xs font-mono italic">
                  {stepperPhase || 'Initializing synthesis engine...'}
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 bg-slate-950/40 border-t border-white/5 backdrop-blur-2xl">
          <form onSubmit={handleSend} className="relative flex items-center max-w-5xl mx-auto group">
            <div className="absolute left-6 text-slate-600 group-focus-within:text-primary transition-colors">
                <MessageSquare size={20} />
            </div>
            <input 
              type="text" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Query the Intel Fabric (Partnerships, Anomalies, Key Players)..."
              className="w-full bg-slate-900/40 border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-20 text-slate-100 focus:outline-none focus:border-primary/50 transition-all shadow-2xl placeholder-slate-600 text-lg sm:text-base"
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              disabled={isProcessing || !inputVal.trim()}
              className="absolute right-3 bg-primary hover:bg-primary/80 disabled:bg-slate-800 text-white size-12 rounded-2xl transition-all shadow-xl shadow-primary/10 active:scale-90 flex items-center justify-center group/btn"
            >
              <Send size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 mt-6">
             <p className="text-[10px] text-slate-700 font-mono tracking-widest uppercase">Context: 153.4k Tokens</p>
             <div className="size-1 bg-slate-800 rounded-full" />
             <p className="text-[10px] text-slate-700 font-mono tracking-widest uppercase">Latency: 284ms</p>
          </div>
        </div>
      </div>

      {/* 2. RESPONSIVE SUBGRAPH PREVIEW */}
      <AnimatePresence>
        {isSubgraphOpen && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed xl:relative left-0 top-0 xl:left-auto lg:top-auto w-[340px] hidden xl:flex flex-col glass-panel-heavy rounded-[2rem] shadow-2xl z-20"
          >
             <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                   <Network size={16} className="text-primary glow-blue"/> Subgraph Context
                </span>
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-amber-500 font-bold uppercase">Real-time</span>
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
                
                {messages.length > 2 ? (
                   <div className="w-full aspect-square rounded-full border border-primary/20 shadow-2xl bg-slate-950/40 flex flex-col items-center justify-center relative p-8 group animate-in zoom-in-95 duration-1000">
                      {/* Abstract Visual Graph */}
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                         <div className="absolute top-1/4 left-1/4 size-8 bg-emerald-500/20 rounded-full border border-emerald-500 shadow-xl shadow-emerald-500/20" />
                         <div className="absolute bottom-1/3 right-1/4 size-10 bg-primary/20 rounded-full border border-primary shadow-xl shadow-primary/20" />
                         <div className="absolute top-1/2 right-1/3 size-6 bg-amber-500/20 rounded-full border border-amber-500" />
                         
                         <svg className="absolute inset-0 w-full h-full opacity-20">
                            <line x1="30%" y1="30%" x2="70%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="6 3" />
                            <line x1="70%" y1="65%" x2="60%" y2="50%" stroke="white" strokeWidth="1" />
                         </svg>
                      </div>
                      
                      <div className="relative z-20 text-center mt-4">
                         <p className="text-[10px] text-slate-300 font-mono font-bold bg-slate-950/80 px-4 py-2 rounded-full border border-white/10 shadow-2xl mb-2">Neural Extraction Active</p>
                         <p className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase opacity-50">Mapping Latest Response Nodes</p>
                      </div>
                   </div>
                ) : (
                   <div className="text-center group p-10">
                      <div className="p-8 glass-panel border-dashed rounded-3xl border-slate-800 hover:border-primary/40 transition-all cursor-default">
                         <Network size={40} className="text-slate-800 mx-auto mb-6 group-hover:text-primary transition-colors group-hover:scale-110 duration-500" />
                         <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em] leading-loose">Neural Link Idle<br/>System Awaiting Prompt</p>
                      </div>
                   </div>
                )}
             </div>
             
             <div className="p-8 border-t border-white/5 bg-slate-950/20">
                <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl border border-white/5 hover:border-primary/30 transition-all flex items-center justify-center gap-3">
                   Full Graph Perspective
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-[10%] left-[5%] size-96 bg-primary/2 px-10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] size-80 bg-secondary/2 px-10 rounded-full blur-[100px] pointer-events-none" />
      
    </div>
  );
}

// Sub-component for icons that aren't imported but used in JSX (fixing imports)
import { MessageSquare } from 'lucide-react';
