import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * ChatMessage - Individual Message Node
 * Visualizes the dialogue turns for User, Agent, and System.
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.4em] py-6"
      >
        {message.content}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`flex gap-6 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar Stack */}
      <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-2xl border ${isUser
          ? 'bg-slate-950 border-white/10 text-slate-400 font-bold'
          : 'bg-primary/20 border-primary/20 text-primary glow-blue'
        }`}>
        {isUser ? <User size={18} /> : <Sparkles size={18} />}
      </div>

      {/* Message Body */}
      <div className={`group relative p-6 rounded-4xl max-w-[85%] lg:max-w-[75%] text-[15px] leading-relaxed shadow-2xl transition-all duration-300 ${isUser
          ? 'bg-primary text-white rounded-tr-sm font-medium hover:bg-primary/95'
          : 'bg-slate-900/40 text-slate-200 rounded-tl-sm border border-white/5 backdrop-blur-md hover:bg-slate-900/60'
        }`}>
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Citations Indicator (If applicable) */}
        {message.citations?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
            {message.citations.map((cite, i) => (
              <span key={cite.id} className="text-[9px] bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5 text-slate-500 font-mono uppercase">
                [Source {cite.id || (i + 1)}]
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
