import React from 'react';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMessage = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
    >
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border 
          ${isUser ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-700/50 border-white/10'}`}>
          {isUser ? <User className="w-5 h-5 text-indigo-400" /> : <Bot className="w-5 h-5 text-emerald-400" />}
        </div>
        
        <div className={`p-4 rounded-2xl glass-card transition-all hover:bg-white/5 relative group
          ${isUser ? 'rounded-tr-none bg-indigo-500/5' : 'rounded-tl-none bg-white/5'}`}>
          <p className="text-slate-200 leading-relaxed font-normal whitespace-pre-wrap text-sm">{content}</p>
          
          {/* Subtle decoration for assistant messages */}
          {!isUser && (
            <div className="absolute -left-1 top-4 w-2 h-2 bg-emerald-500/20 rounded-full blur-sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
