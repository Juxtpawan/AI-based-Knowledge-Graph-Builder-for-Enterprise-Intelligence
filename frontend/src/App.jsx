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

export default App;
