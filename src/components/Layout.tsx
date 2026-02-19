
import React from 'react';
import { View } from '../../types';
import { Icons, COLORS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (v: View) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  role?: 'admin' | 'viewer' | 'super';
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onLogout, isAuthenticated, role }) => {
  if (!isAuthenticated) return <>{children}</>;

  const isViewer = role === 'viewer';

  return (
    <div className="min-h-screen pb-24 flex flex-col bg-[#0b0e14]">
      {/* Hero Header Section - Non Sticky */}
      <header className="bg-white py-8 px-4 text-center shadow-md border-b-4 border-[#1b264f] mb-6">
        <div 
          className="max-w-4xl mx-auto flex flex-col items-center cursor-pointer transition-transform active:scale-95"
          onClick={() => setView(View.DASHBOARD)}
        >
          {/* Company Logo Image */}
          <div className="mb-4">
             <img 
               src="https://greatplacetowork.lk/wp-content/uploads/2024/09/LTL-Logo-2025.png"
               alt="LTL Transformers Logo"
               className="h-20 sm:h-24 w-auto object-contain"
               onError={(e) => {
                 // Fallback if image fails to load
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = `
                   <div class="w-20 h-20 bg-[#1b264f] rounded-full flex items-center justify-center p-2">
                      <span class="text-white text-3xl font-black italic">LT</span>
                   </div>
                 `;
               }}
             />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-[#1b264f] tracking-tight uppercase leading-none">
            LTL TRANSFORMERS (PVT) LTD
          </h1>
          
          <p className="mt-2 text-sm sm:text-base font-bold text-[#8cc63f] italic tracking-wide uppercase">
            Engineering for better transformation
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="mt-auto py-12 px-4 border-t border-[#30363d] text-center text-gray-500 text-sm bg-[#0d1117]">
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Technical Support</p>
          <strong className="text-sky-500 text-base">Lead Engineer: Isuru Wijerathna</strong>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-10">
          <div className="flex items-center gap-2">
            <span className="text-[#8cc63f]">📞</span>
            <span>+94 759054648</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8cc63f]">✉️</span>
            <span>xpisuru@gmail.com</span>
          </div>
        </div>
        <p className="mt-8 opacity-40 font-medium">© 2026 LTL Transformers Smart Systems. All Rights Reserved.</p>
      </footer>

      {/* Persistent Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#000] border-t border-[#30363d] px-2 py-3 flex justify-around items-center backdrop-blur-md bg-black/80">
        <button 
          onClick={() => setView(View.DASHBOARD)}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${activeView === View.DASHBOARD ? 'text-sky-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Icons.Dashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Live View</span>
        </button>
        
        {!isViewer && (
          <button 
            onClick={() => setView(View.CALIBRATION_AUTH)}
            className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${[View.TANK_SELECTION, View.CALIBRATION_AUTH, View.WIZARD, View.USER_MANAGEMENT, View.CHANGE_PIN].includes(activeView) ? 'text-emerald-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icons.Adjustments className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Admin</span>
          </button>
        )}

        <button 
          onClick={() => setView(View.SETTINGS)}
          className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${activeView === View.SETTINGS ? 'text-sky-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Icons.Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Security</span>
        </button>
        <button 
          onClick={onLogout}
          className="flex flex-col items-center gap-1 text-red-500/80 hover:text-red-500 transition-all flex-1 py-1"
        >
          <Icons.Logout className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
