import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NetworkView from './pages/NetworkView';
import TopicExplorer from './pages/TopicExplorer';
import RagAgentChat from './pages/RagAgentChat';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardMetrics from './components/dashboard/DashboardMetrics';
import { useIntelStore } from './store/useIntelStore';
import { LogOut, Globe, Menu, X } from 'lucide-react';

/**
 * Main App Layout (Shell) 
 * Only rendered after Authentication
 */
function MainLayout() {
  const location = useLocation();
  const { user, logout } = useIntelStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    const base = "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all decoration-none relative whitespace-nowrap";
    return `${base} ${isActive ? 'text-vidzai-emerald' : 'text-slate-500 hover:text-slate-300'}`;
  };

  const navLinks = [
    { name: 'Overview', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Graph Studio', path: '/graph-studio' },
    { name: 'Assistant', path: '/agent' },
  ];

  return (
    <div className="flex h-screen bg-background-deep text-slate-200 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOP NAVIGATION BAR */}
        <header className="vidzai-top-bar flex items-center justify-between px-4 md:px-8 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
           <div className="flex items-center gap-4 lg:gap-12">
              {/* Mobile Menu Trigger */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center justify-center gap-3">
                  <img src="/favicon.png" alt="" className='rounded-full w-8 h-8 md:w-10 md:h-10'/>
                 <h1 className="text-sm md:text-lg font-black tracking-tighter text-vidzai-emerald uppercase flex items-center gap-2">
                    Vidzai
                 </h1>
              </div>
              
              {/* Desktop Nav */}
              <nav className="hidden lg:flex gap-4">
                 {navLinks.map(link => (
                    <Link key={link.path} to={link.path} className={getNavClass(link.path)}>{link.name}</Link>
                 ))}
              </nav>
           </div>

           <div className="flex items-center gap-3 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4 border-l border-slate-800 pl-4 md:pl-6">
                 {/* User Identity */}
                 <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-bold text-slate-200 leading-none truncate max-w-[120px]">{user?.name}</p>
                       <p className="text-[8px] font-mono text-vidzai-emerald uppercase tracking-tighter truncate max-w-[120px]">{user?.email}</p>
                    </div>
                    <div className="size-8 md:size-9 rounded-full border border-white/10 overflow-hidden bg-slate-800 flex items-center justify-center">
                       {user?.picture ? (
                         <img src={user.picture} alt="Profile" className="size-full object-cover" />
                       ) : (
                         <Globe size={18} className="text-slate-500" />
                       )}
                    </div>
                 </div>

                 {/* Logout Action */}
                 <button 
                    onClick={logout}
                    className="p-1.5 md:p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all group"
                    title="Terminate Session"
                 >
                    <LogOut size={16} md:size={18} className="group-hover:translate-x-0.5 transition-transform" />
                 </button>
              </div>
           </div>
        </header>

        {/* Mobile Sidebar Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
              />
              {/* Drawer */}
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-white/10 z-50 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-10">
                   <h2 className="text-vidzai-emerald font-black uppercase tracking-tighter">Navigator</h2>
                   <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white">
                      <X size={20} />
                   </button>
                </div>
                <nav className="flex flex-col gap-2">
                  {navLinks.map(link => (
                    <Link 
                      key={link.path} 
                      to={link.path} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all ${
                        location.pathname === link.path ? 'bg-vidzai-emerald/10 text-vidzai-emerald border border-vidzai-emerald/20' : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-white/5">
                   <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Vidzai Digital Platform</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MODULE VIEWPORT */}
        <main className="flex-1 overflow-auto relative bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#050505_100%)]">
           <AnimatePresence mode="wait">
             <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8">
                     <div className="mb-6 md:mb-10 animate-window-entry">
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Graph Insights</h2>
                        <div className="h-1 w-16 md:w-24 bg-vidzai-emerald rounded-full mt-2" />
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
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
