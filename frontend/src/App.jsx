<<<<<<< HEAD
import React, { useState } from 'react';
import { LayoutDashboard, MessageSquare, Menu, X, Info } from 'lucide-react';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'chat', label: 'Intelligence Chat', icon: MessageSquare },
    { id: 'dashboard', label: 'Graph Analytics', icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-72' : 'w-20'} 
        glass border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col z-20
      `}>
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10 overflow-hidden group-hover:border-indigo-500/50 transition-colors">
            <img src="/favicon.png" alt="Vidzai Logo" className="w-full h-full object-cover scale-110 rounded-lg" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">Vidzai</span>
              <span className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-bold">Enterprise Intelligence</span>
            </div>
          )}
        </div>


        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                ${activeTab === item.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-white/5 border border-transparent'}
              `}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-400' : 'group-hover:text-white'}`} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isSidebarOpen && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center bg-background relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full z-0" />
        
        {/* Rendering Active View */}
        <div className="relative z-10 w-full h-full animate-fade-in flex flex-col">
          {activeTab === 'chat' ? <ChatView /> : <DashboardView />}
        </div>
      </main>
    </div>
  );
};
=======
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NetworkView from './pages/NetworkView';
import TopicExplorer from './pages/TopicExplorer';
import RagAgentChat from './pages/RagAgentChat';
import DashboardMetrics from './components/dashboard/DashboardMetrics';
import CommandPalette from './components/search/CommandPalette';
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
>>>>>>> recovery-branch

export default App;
