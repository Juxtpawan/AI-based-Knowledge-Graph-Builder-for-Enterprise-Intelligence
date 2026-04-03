import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIntelStore } from '../store/useIntelStore';
import { Shield, Lock, Cpu, Globe } from 'lucide-react';

export default function LoginPage() {
  const login = useIntelStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Login Success:", decoded);
    
    login({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    });
    
    navigate(from, { replace: true });
  };

  const handleError = () => {
    console.error("Login Failed");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vidzai-emerald/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-[92%] sm:w-full max-w-md p-6 sm:p-8 glass-panel border border-white/5 rounded-3xl shadow-2xl flex flex-col items-center text-center"
      >
        {/* Logo Section */}
        <div className="mb-6 sm:mb-8">
          <div className="size-12 sm:size-16 rounded-full bg-vidzai-emerald/10 border border-vidzai-emerald/20 flex items-center justify-center mb-4 mx-auto">
            <Cpu className="text-vidzai-emerald" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase italic">
            Vidzai <span className="text-vidzai-emerald not-italic">Digital</span>
          </h1>
          <p className="text-slate-500 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] mt-2">Enterprise Knowledge Graph Platform</p>
        </div>

        <div className="space-y-6 w-full mb-8 sm:mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
             <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center gap-2">
                <Shield size={16} className="text-vidzai-emerald" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Auth</span>
             </div>
             <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Global Data</span>
             </div>
          </div>
          
          <div className="text-xs sm:text-sm text-slate-400 leading-relaxed px-2 sm:px-4">
            Professional intelligence platform for analysis and agentic graph discovery.
          </div>
        </div>

        {/* Google Login Button Container */}
        <div className="w-full flex items-center justify-center">
            <div className="p-1 rounded-lg bg-white overflow-hidden shadow-xl hover:scale-[1.02] transition-transform">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                    theme="filled_blue"
                    shape="rectangular"
                />
            </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 tracking-widest uppercase flex items-center gap-3">
      </div>
    </div>
  );
}
