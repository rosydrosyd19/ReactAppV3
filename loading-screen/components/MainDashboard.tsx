
import React from 'react';

interface MainDashboardProps {
  onReset: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onReset }) => {
  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-xl">N</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Nexus OS</h1>
        </div>
        <button 
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 rounded-full"
        >
          Reload Interface
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "System Health", value: "99.8%", color: "text-emerald-400" },
          { title: "Network Load", value: "240 MB/s", color: "text-indigo-400" },
          { title: "Security Protocols", value: "Active", color: "text-purple-400" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{stat.title}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <main className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            Welcome to the future <br /> of digital interfaces.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
            The loading screen you just experienced was optimized for visual tranquility. 
            Modern design isn't just about speed; it's about the feeling of momentum.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-full font-semibold shadow-xl shadow-indigo-500/30">
              Get Started
            </button>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 transition-all border border-white/10 rounded-full font-semibold backdrop-blur-md">
              Documentation
            </button>
          </div>
        </div>

        {/* Abstract Background for Main Section */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
      </main>

      <footer className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between gap-6 text-slate-500 text-sm">
        <p>&copy; 2024 Nexus Intelligent Systems. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  );
};

export default MainDashboard;
