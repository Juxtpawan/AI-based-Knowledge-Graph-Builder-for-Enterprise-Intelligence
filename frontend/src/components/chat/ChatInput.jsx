import React from 'react';
import { Send, MessageSquare } from 'lucide-react';

/**
 * ChatInput - Multi-Input Field with Context Indicators
 * Handles user input, submit actions, and metadata display.
 */
export default function ChatInput({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="p-8 bg-slate-950/40 border-t border-white/5 backdrop-blur-2xl">
      <form onSubmit={onSubmit} className="relative flex items-center max-w-5xl mx-auto group">
        {/* Input Suffix Icon */}
        <div className="absolute left-6 text-slate-600 group-focus-within:text-primary transition-colors">
          <MessageSquare size={20} />
        </div>

        {/* Core Field */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Query the Intel Fabric (Partnerships, Anomalies, Key Players)..."
          className="w-full bg-slate-900/40 border border-white/5 rounded-3xl py-5 pl-16 pr-20 text-slate-100 focus:outline-none focus:border-primary/50 transition-all shadow-2xl placeholder-slate-600 text-lg sm:text-base font-sans"
          disabled={disabled}
        />

        {/* Interaction Trigger */}
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="absolute right-3 bg-primary hover:bg-primary/80 disabled:bg-slate-800 text-white size-12 rounded-2xl transition-all shadow-xl shadow-primary/10 active:scale-90 flex items-center justify-center group/btn"
        >
          <Send size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>
      </form>

    </div>
  );
}
