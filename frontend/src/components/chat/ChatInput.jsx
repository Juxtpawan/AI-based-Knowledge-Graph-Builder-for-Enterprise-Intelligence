import React from 'react';
import { Send, Sparkles } from 'lucide-react';

const ChatInput = ({ input, setInput, onSend, isLoading }) => {
  return (
    <div className="relative group">
      {/* Decorative gradient glow */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-all duration-500" />
      
      <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Ask about employees, communication or entities..."
            className="w-full bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 text-sm h-10"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center 
            ${!input.trim() || isLoading 
              ? 'bg-white/5 text-slate-600' 
              : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 hover:scale-105 active:scale-95'}`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      
      {/* Footer hint */}
      <div className="flex justify-between items-center mt-3 px-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-amber-500/50" />
          Enterprise RAG Nexus
        </p>
        <span className="text-[10px] text-slate-600 font-medium tracking-wide">Press Enter to dispatch query</span>
      </div>
    </div>
  );
};

export default ChatInput;
