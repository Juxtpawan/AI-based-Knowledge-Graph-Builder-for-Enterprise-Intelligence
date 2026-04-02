import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kgService } from '../services/apiClient';
import { useIntelStore } from '../store/useIntelStore';
import { 
  Bot, LayoutGrid, Terminal, 
  Search, Globe, ShieldCheck, Zap 
} from 'lucide-react';

// Modular Components
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ThoughtStepper from '../components/chat/ThoughtStepper';
import IntelligenceSidebar from '../components/chat/IntelligenceSidebar';

/**
 * RagAgentChat - High-Fidelity Forensic Investigator
 * Updated with modular components and premium Vidzai aesthetics.
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
        id: 1, 
        role: 'agent', 
        content: 'I have analyzed the Enron metadata corpus and mapped semantic triplets to the vector space. We are ready to begin the forensic audit. What specific entities or events should we probe first?' 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thoughtStep, setThoughtStep] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [activeTab, setActiveTab] = useState('graph');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (selectedElement) {
        setActiveTab('probe');
        setIsSidebarOpen(true);
    }
  }, [selectedElement]);

  const simulateThoughtProcess = async () => {
    for (let i = 0; i <= 3; i++) {
      setThoughtStep(i);
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: inputVal };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setThoughtStep(0);

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
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        content: "Operational Error: Intelligence link severed. Verify backend stability and Neo4j connectivity."
      }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-full p-4 lg:p-8 gap-6 bg-[#020617] relative overflow-hidden font-sans">
      
      {/* 1. Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden relative z-10 shadow-2xl">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-slate-950/40 flex items-center justify-between backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Bot className="text-indigo-400" size={26} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-white tracking-[0.3em] uppercase">Intelligence Analyst</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     Gemini 1.5 Flash Connected
                  </p>
               </div>
            </div>
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 transition-all hover:scale-105 active:scale-95"
            >
                <LayoutGrid size={20} />
            </button>
        </div>

        {/* Message Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-10 space-y-8 no-scrollbar scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}
          </AnimatePresence>

          <ThoughtStepper 
            isThinking={isLoading} 
            step={thoughtStep} 
          />
        </div>

        {/* Input Bar */}
        <div className="p-8 pt-0 mt-auto">
          <ChatInput 
            input={inputVal}
            setInput={setInputVal}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 2. Intelligence Sidebar */}
      <IntelligenceSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedElement={selectedElement}
      />

      {/* Atmospheric Decorations */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
