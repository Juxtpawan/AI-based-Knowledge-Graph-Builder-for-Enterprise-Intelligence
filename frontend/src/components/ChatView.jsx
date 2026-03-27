import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Enterprise Intelligence Assistant. How can I help you explore the knowledge graph today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/query', { query: input });
      const assistantMessage = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing your request. Please ensure the backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shadow-sm">
          <img src="/favicon.png" alt="Vidzai Logo" className="w-full h-full object-cover scale-110 rounded-lg" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Enterprise Intelligence</h2>
          <p className="text-sm text-slate-400">Hybrid RAG Knowledge Retrieval</p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border 
                  ${msg.role === 'user' ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-700/50 border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-indigo-400" /> : <Bot className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className={`p-4 rounded-2xl glass-card transition-all hover:bg-white/5
                  ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="p-4 rounded-2xl glass-card rounded-tl-none flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-slate-400 text-sm">Generating answer...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 pt-0">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about employees, communication or entities..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 text-slate-500 uppercase tracking-widest font-medium">
          Powered by Gemini 3 Flash preview, Pinecone & Neo4j
        </p>
      </div>
    </div>
  );
};

export default ChatView;
