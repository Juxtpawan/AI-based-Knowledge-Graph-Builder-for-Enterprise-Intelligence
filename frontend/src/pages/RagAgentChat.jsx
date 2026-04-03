import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';
import { useIntelStore } from '../store/useIntelStore';
import {
  Bot, LayoutGrid, Sparkles, Send, Terminal,
  Search, Globe, FileSearch, Fingerprint, Zap
} from 'lucide-react';

// Modular Components
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ThoughtStepper from '../components/chat/ThoughtStepper';
import IntelligenceSidebar from '../components/chat/IntelligenceSidebar';

/**
 * RagAgentChat - High-Fidelity Forensic Investigator
 * Restored with Dual-Mode (Graph/Probe) Tab Logic and AI Context Sync.
 */
export default function RagAgentChat() {
  const {
    selectedElement,
    setSelectedElement,
    expandNode,
    setCustomGraphData
  } = useIntelStore();

  const [messages, setMessages] = useState([
    {
      id: 2,
      role: 'agent',
      content: 'I have analyzed the Enron metadata corpus and mapped semantic triplets to the vector space. We are ready to begin the forensic audit. What specific entities or events should we probe first?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepperPhase, setStepperPhase] = useState(null);
  const [isSubgraphOpen, setIsSubgraphOpen] = useState(window.innerWidth >= 1280);
  const [activeTab, setActiveTab] = useState('graph');
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Sync: Switch to 'Probe' mode when an entity is selected
  useEffect(() => {
    if (selectedElement) {
      setActiveTab('probe');
      setIsSubgraphOpen(true);
    }
  }, [selectedElement]);

  const simulateThoughtProcess = async () => {
    const phases = [
      'Extracting semantic embeddings...',
      'Traversing structural Neo4j triplets...',
      'Synthesizing hybrid RAG response...'
    ];
    for (const phase of phases) {
      setStepperPhase(phase);
      await new Promise(r => setTimeout(r, 800));
    }
    setStepperPhase(null);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: inputVal };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);
    setActiveTab('graph'); // Reset to graph view for new answer

    try {
      const [response] = await Promise.all([
        kgService.queryRag(userMsg.content),
        simulateThoughtProcess()
      ]);

      if (response.graph) {
        setCustomGraphData(response.graph);
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: response.answer,
        citations: response.citations || [],
        graph: response.graph
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: "Operational Error: Intelligence link severed. Verify backend stability and Neo4j connectivity."
      }]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-full p-4 lg:p-8 gap-6 bg-slate-950 relative overflow-hidden font-sans">

      {/* --- 1. PRIMARY INVESTIGATION RAIL --- */}
      <div className="flex-1 flex flex-col vidzai-glass rounded-4xl overflow-hidden relative z-10 border-white/5">

        {/* Header: AI Terminal Branding */}
        <div className="p-6 border-b border-white/5 bg-slate-950/40 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-primary/15 rounded-2xl border border-primary/30 shadow-2xl shadow-primary/10">
              <Bot className="text-primary" size={26} />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white tracking-widest uppercase">Forensic Analyst</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSubgraphOpen(!isSubgraphOpen)}
              className="p-3 bg-slate-900 border border-white/5 hover:border-white/20 rounded-xl text-slate-400 transition-all active:scale-95"
              title="Toggle Intelligence Sidebar"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        {/* Dialogue Stream: Scroll Space */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-12 custom-scrollbar scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </AnimatePresence>

          <ThoughtStepper
            isProcessing={isProcessing}
            phase={stepperPhase}
          />
        </div>

        {/* Intelligent Input Zone */}
        <ChatInput
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handleSend}
          disabled={isProcessing}
        />
      </div>

      {/* --- 2. INTELLIGENCE STACK (SIDEBAR) --- */}
      <IntelligenceSidebar
        isOpen={isSubgraphOpen}
        onClose={() => setIsSubgraphOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        messages={messages}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        expandNode={expandNode}
      />

      {/* Atmospheric Overlays */}
      <div className="absolute top-[-10%] left-[-10%] size-[600px] bg-primary/5 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />

    </div>
  );
}
