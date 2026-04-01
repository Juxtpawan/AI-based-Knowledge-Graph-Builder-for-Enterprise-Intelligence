import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NetworkView from './pages/NetworkView';
import TopicExplorer from './pages/TopicExplorer';
import RagAgentChat from './pages/RagAgentChat';
import DashboardMetrics from './components/DashboardMetrics';
import CommandPalette from './components/CommandPalette';
import { 
  Bell,
  Search,
} from 'lucide-react';
import { RiAccountCircleFill } from "react-icons/ri";

function App() {
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Command Palette Shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    return `px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all decoration-none relative ${
      isActive ? 'text-vidzai-emerald' : 'text-slate-500 hover:text-slate-300'
    }`;
  };

  return (
    <div className="flex h-screen bg-background-deep text-slate-200 font-sans overflow-hidden">
      
      {/* 2. MAIN SHELL CONTENT */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOP NAVIGATION BAR */}
        <header className="vidzai-top-bar flex items-center justify-between px-8 z-50">
           <div className="flex items-center gap-12">
              <div className="flex items-center justify-center gap-3">
                  <img src="/favicon.png" alt="" className='rounded w-10 h-10'/>
                 <h1 className="text-lg font-black tracking-tighter text-vidzai-emerald uppercase flex items-center gap-2">
                    Vidzai
                 </h1>
              </div>
              
              {/* Primary Tabs */}
              <nav className="flex gap-4">
                 <Link to="/" className={getNavClass('/')}>Overview</Link>
                 <Link to="/explore" className={getNavClass('/explore')}>Explore</Link>
                 <Link to="/graph-studio" className={getNavClass('/graph-studio')}>Graph Studio</Link>
                 <Link to="/agent" className={getNavClass('/agent')}>Assistant</Link>
              </nav>
           </div>

           {/* Top Right Utilities */}
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-5 border-l border-slate-800 pl-6">
                 <Search 
                    size={20} 
                    className="text-slate-500 hover:text-vidzai-emerald cursor-pointer transition-colors"
                    onClick={() => setIsCommandPaletteOpen(true)}
                 />
                 <Bell size={20} className="text-slate-500 hover:text-vidzai-emerald cursor-pointer transition-colors" />
                 <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="size-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-vidzai-emerald transition-all">
                       <RiAccountCircleFill size={20} className="text-slate-500 hover:text-vidzai-emerald cursor-pointer transition-colors" />
                    </div>
                 </div>
              </div>
           </div>
        </header>

        {/* MODULE VIEWPORT */}
        <main className="flex-1 overflow-auto relative bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#050505_100%)]">
           <AnimatePresence mode="wait">
             <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
                     <div className="mb-10 animate-window-entry">
                        <h2 className="text-3xl font-black text-white tracking-tighter">Graph Insights</h2>
                        <div className="h-1 w-24 bg-vidzai-emerald rounded-full mt-2" />
                     </div>
                     <DashboardMetrics />
                  </motion.div>
                } />
                <Route path="/explore" element={<NetworkView />} />
                <Route path="/graph-studio" element={<TopicExplorer />} />
                <Route path="/agent" element={<RagAgentChat />} />
             </Routes>
           </AnimatePresence>
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}

export default App;
