import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, User, Send, Loader2, Activity, GitBranchPlus, 
  Search, BrainCircuit, Terminal, Fingerprint, Zap, 
  AlertTriangle, ShieldCheck, Database, Globe 
} from 'lucide-react';
import { kgService } from '../../services/apiClient';
import { useIntelStore } from '../../store/useIntelStore';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Components
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ThoughtStepper from './ThoughtStepper';

/**
 * UnifiedChatRail - High-Fidelity Forensic Investigator (Modularized)
 * Integrated with atomic components for consistency across the suite.
 */
export default function UnifiedChatRail() {
  const { selectedElement, setSelectedElement, setCustomGraphData } = useIntelStore();
  const [messages, setMessages] = useState([
    { 
        id: 1, 
        role: 'agent', 
        content: 'Neural Fabric initialized. I have mapped the Enron semantic space to the vector store. Ready for forensic exploration.' 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepperPhase, setStepperPhase] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll logic with smooth behavior
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isProcessing, stepperPhase]);

  // Handle Forensic Probe (Deep Action)
  const handleForensicProbe = async () => {
    if (!selectedElement) return;
    
    const nodeName = selectedElement.properties?.name || selectedElement.properties?.subject || 'Entity';
    const probeQuery = `Perform deep Forensic Probe on ${nodeName}: identify communication anomalies and central relationships.`;
    
    setInputVal(probeQuery);
    // Auto-submit for a smooth user flow
    handleSend(null, probeQuery);
  };

  const handleSend = async (e, overrideInput) => {
    if (e) e.preventDefault();
    const query = overrideInput || inputVal;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);
    
    // Thought Stepping Simulation
    const phases = [
        'Initializing GraphRAG Pipeline...',
        'Extracting Contextual Subgraphs...',
        'Traversing Semantic Neo4j Triplets...',
        'Analyzing Communication Volumetrics...',
        'Synthesizing Forensic Metadata...'
    ];
    
    try {
      // Run thought process and API call in parallel if possible, 
      // but here we simulate a sequential flow for the "reasoning" feel
      for (const phase of phases) {
          setStepperPhase(phase);
          await new Promise(r => setTimeout(r, 600));
      }

      const res = await kgService.queryRag(query);
      
      if (res.graph) {
          setCustomGraphData(res.graph);
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: res.answer,
        graph: res.graph,
        citations: res.citations || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: "Critical Intel Failure: Intelligence link severed or Backend 500."
      }]);
    }
    setIsProcessing(false);
    setStepperPhase(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 relative font-sans overflow-hidden border-l border-white/5 backdrop-blur-xl">
      
      {/* 1. INVESTIGATION STREAM */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </AnimatePresence>
        
        {/* MODULAR THOUGHT STEPPER */}
        <ThoughtStepper 
          isProcessing={isProcessing} 
          phase={stepperPhase} 
        />
      </div>

      {/* 2. PROBE ACTIVATION ZONE */}
      <AnimatePresence>
        {selectedElement && !isProcessing && (
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 50, opacity: 0 }}
             className="px-6 py-4 bg-primary/10 border-t border-primary/20 flex items-center justify-between shadow-2xl relative z-20"
           >
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/20 rounded-xl text-primary">
                    <Fingerprint size={16} />
                 </div>
                 <div>
                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em] block">Entity Detected</span>
                    <span className="text-[9px] text-primary font-bold uppercase tracking-widest truncate max-w-[120px] block border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-lg mt-0.5">
                        {selectedElement.properties?.name || selectedElement.properties?.subject || 'Atomic Node'}
                    </span>
                 </div>
              </div>
              <button 
                onClick={handleForensicProbe} 
                className="group flex items-center gap-2.5 bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                 <Zap size={14} className="group-hover:fill-current" /> PROBE
              </button>
           </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MODULAR INPUT ZONE */}
      <div className="relative z-20">
        <ChatInput 
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handleSend}
          disabled={isProcessing}
        />
        
        {/* Status Indicators (Internal context branding) */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 pointer-events-none opacity-40">
           <div className="flex items-center gap-2">
              <div className="size-1.5 bg-emerald-500 rounded-full glow-emerald" />
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Neural Link: Active</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="size-1.5 bg-primary rounded-full glow-blue" />
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Logic Fabric: v2.4</span>
           </div>
        </div>
      </div>

      {/* Atmospheric Underlays */}
      <div className="absolute top-[20%] right-[-10%] size-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] size-60 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}

