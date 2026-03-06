
import React, { useState, useEffect, useRef } from 'react';
import { Theme, User, Module } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { ModuleCard } from './components/ModuleCard';
import { getAIGreeting } from './services/geminiService';

// --- Icons ---
// Explicitly defined IconProps to fix inference issues at call sites
interface IconProps {
  size?: number;
  className?: string;
}

const IconSearch = ({ size = 20, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconMenu = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconChevronDown = ({ isOpen }: { isOpen: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const IconLayout = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconGrid = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconBell = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconMessage = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconSettings = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconUserCircle = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconLogout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconBox = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconUsers = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCurrency = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconTrending = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconClipboard = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const IconShield = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [user] = useState<User>({ name: 'John Doe', role: 'Super Admin' });
  const [aiMessage, setAiMessage] = useState<string>('Welcome back!');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moduleSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || Theme.LIGHT;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === Theme.DARK);

    const fetchGreeting = async () => {
      const msg = await getAIGreeting(user.name);
      setAiMessage(msg);
    };
    fetchGreeting();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user.name]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === Theme.DARK);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const scrollToModules = () => {
    moduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab('All Modules');
  };

  const modules: Module[] = [
    { id: 'asset-management', title: 'Asset Management', description: 'Track enterprise assets and inventory.', icon: <IconBox />, path: '/assets', color: 'blue' },
    { id: 'hr-management', title: 'HR Management', description: 'Manage employee data and payroll.', icon: <IconUsers />, path: '/hr', color: 'emerald' },
    { id: 'finance-accounting', title: 'Finance & Accounting', description: 'Oversee budgets and expenses.', icon: <IconCurrency />, path: '/finance', color: 'rose' },
    { id: 'crm-sales', title: 'CRM & Sales', description: 'Track customer relationships and leads.', icon: <IconTrending />, path: '/crm', color: 'amber' },
    { id: 'project-management', title: 'Project Management', description: 'Coordinate tasks and milestones.', icon: <IconClipboard />, path: '/projects', color: 'teal' },
    { id: 'sys-admin', title: 'System Administrator', description: 'Manage permissions and security.', icon: <IconShield />, path: '/admin', color: 'indigo' }
  ];

  const handleBackToModules = () => {
    setActiveTab('All Modules');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    scrollToModules();
  };

  return (
    <div className={`min-h-screen relative flex flex-col lg:flex-row transition-colors duration-500 ${theme === Theme.DARK ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen transition-all duration-500 ease-in-out z-40 flex flex-col overflow-hidden
        bg-white dark:bg-slate-900 shadow-2xl 
        lg:bg-transparent lg:dark:bg-transparent lg:shadow-none lg:border-none
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        <div className={`p-4 h-16 flex items-center transition-all duration-500 ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
           <button 
              onClick={toggleSidebar}
              className="flex items-center group p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 active:scale-95"
              aria-label="Toggle Sidebar"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <span className="text-white font-bold text-2xl select-none">N</span>
              </div>
              <div className={`flex items-center transition-all duration-500 overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto translate-x-0 ml-3' : 'opacity-0 w-0 -translate-x-4 ml-0'}`}>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white select-none whitespace-nowrap">
                  Nexus Core
                </span>
              </div>
            </button>
        </div>

        <div className="mt-6 flex-1 px-3 overflow-y-auto no-scrollbar">
          <nav className="space-y-4 transition-all duration-500">
            <div>
              <SidebarSection label="Master" isOpen={isSidebarOpen} />
              <div className="space-y-1">
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Dashboard'} icon={<IconLayout />} label="Dashboard" onClick={() => { setActiveTab('Dashboard'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'All Modules'} icon={<IconGrid />} label="All Modules" onClick={handleBackToModules} />
              </div>
            </div>

            <div>
              <SidebarSection label="Transaksi" isOpen={isSidebarOpen} />
              <div className="space-y-1">
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Inventory'} icon={<IconBox />} label="Inventory" onClick={() => setActiveTab('Inventory')} />
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Finance'} icon={<IconCurrency />} label="Payment" onClick={() => setActiveTab('Finance')} />
              </div>
            </div>

            <div>
              <SidebarSection label="Report" isOpen={isSidebarOpen} />
              <div className="space-y-1">
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Analytics'} icon={<IconTrending />} label="Analytics" onClick={() => setActiveTab('Analytics')} />
                <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Logs'} icon={<IconShield />} label="System Logs" onClick={() => setActiveTab('Logs')} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/10">
              <SidebarLink isOpen={isSidebarOpen} active={activeTab === 'Support'} icon={<IconMessage />} label="Support" onClick={() => setActiveTab('Support')} />
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200/10 dark:border-slate-800/10">
           <div className={`rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-600/20 text-indigo-600 dark:text-indigo-400 transition-all duration-500 overflow-hidden ${isSidebarOpen ? 'p-4 opacity-100' : 'p-0 h-0 border-none opacity-0'}`}>
             <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Status</p>
             <p className="text-xs font-bold truncate">CONNECTED</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col relative z-10 min-h-screen transition-all duration-500 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        
        {/* Global Header */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-transparent px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300 transition-all active:scale-95 mr-4"
              aria-label="Open Menu"
            >
              <IconMenu />
            </button>
            <h2 className="lg:hidden font-bold text-lg tracking-tight">Nexus Core</h2>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
             {/* Search Bar (Desktop) */}
             <div className="hidden md:flex items-center bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 mr-2">
                <IconSearch size={16} className="text-slate-400" />
                <input type="text" placeholder="Search analytics..." className="bg-transparent border-none outline-none text-xs ml-2 w-48 font-medium" />
             </div>

            <button 
              onClick={scrollToModules}
              className="p-2 rounded-full transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none text-indigo-600 dark:text-indigo-400 active:scale-95"
              aria-label="Pilih Modul"
              title="Pilih Modul"
            >
              <IconGrid size={20} />
            </button>

            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="h-6 w-px bg-slate-200/20 dark:bg-slate-700/20 hidden sm:block mx-2"></div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1 pr-2 sm:pr-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md"> JD </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold leading-tight">{user.name}</p>
                </div>
                <IconChevronDown isOpen={isDropdownOpen} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-widest">Account Profile</p>
                    <p className="text-sm font-bold truncate mt-1 text-slate-900 dark:text-white">{user.name}</p>
                  </div>
                  <DropdownItem icon={<IconUserCircle />} label="Detail Profile" />
                  <DropdownItem icon={<IconSettings />} label="Settings" />
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                  <DropdownItem icon={<IconLogout />} label="Logout" variant="danger" onClick={() => alert('Logging out...')} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-12">
          <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
            
            {/* Header / Welcome */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">
                  Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Overview</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic"> 
                  "{aiMessage}" 
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-50 dark:border-slate-900 bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                   ))}
                   <div className="w-8 h-8 rounded-full border-2 border-slate-50 dark:border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">+8</div>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">Invite Team</button>
              </div>
            </div>

            {/* DASHBOARD ANALYTICS SECTION */}
            <section className="space-y-8">
              
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard title="Total Revenue" value="$42,850" trend="+12.5%" icon={<IconCurrency size={18}/>} color="emerald" />
                <MetricCard title="Active Sessions" value="1,240" trend="+8.2%" icon={<IconUsers size={18}/>} color="blue" />
                <MetricCard title="Project Velocity" value="84%" trend="-2.4%" icon={<IconTrending size={18}/>} color="amber" />
                <MetricCard title="System Health" value="99.9%" trend="+0.1%" icon={<IconShield size={18}/>} color="indigo" />
              </div>

              {/* Main Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Workflow Efficiency Chart (Wider Column) */}
                <div className="lg:col-span-8 group p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="font-bold text-lg">Workflow Efficiency</h3>
                        <p className="text-xs text-slate-400 font-medium">Performance tracking over the last 30 days</p>
                      </div>
                      <select className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-xs font-bold px-2 py-1 outline-none">
                        <option>Monthly</option>
                        <option>Weekly</option>
                      </select>
                   </div>
                   
                   {/* Custom SVG Line Chart Simulation */}
                   <div className="h-64 w-full relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid Lines */}
                        <line x1="0" y1="0" x2="800" y2="0" stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="1" />
                        <line x1="0" y1="50" x2="800" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="1" />
                        <line x1="0" y1="100" x2="800" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="1" />
                        <line x1="0" y1="150" x2="800" y2="150" stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="1" />
                        <line x1="0" y1="200" x2="800" y2="200" stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="1" />
                        
                        {/* Area Fill */}
                        <path d="M0,200 L0,150 C50,140 100,160 150,130 C200,100 250,110 300,70 C350,30 400,60 450,90 C500,120 550,100 600,60 C650,20 700,40 750,30 C800,20 800,20 800,200 Z" fill="url(#chartGradient)" />
                        
                        {/* Line Path */}
                        <path d="M0,150 C50,140 100,160 150,130 C200,100 250,110 300,70 C350,30 400,60 450,90 C500,120 550,100 600,60 C650,20 700,40 750,30 C800,20" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
                        
                        {/* Dots */}
                        <circle cx="150" cy="130" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                        <circle cx="300" cy="70" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                        <circle cx="450" cy="90" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                        <circle cx="600" cy="60" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                        <circle cx="750" cy="30" r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                      </svg>
                      
                      <div className="absolute inset-0 flex items-center justify-around text-[10px] font-bold text-slate-400 pointer-events-none mt-40">
                         <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                      </div>
                   </div>
                </div>

                {/* Recent Activity (Narrative Column) */}
                <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col">
                   <h3 className="font-bold text-lg mb-6">Recent Activities</h3>
                   <div className="space-y-6 flex-1">
                      <ActivityItem user="Alex M." action="uploaded a new asset" time="2m ago" color="blue" />
                      <ActivityItem user="Sarah K." action="updated payroll module" time="15m ago" color="emerald" />
                      <ActivityItem user="System" action="deployed v2.4 hotfix" time="1h ago" color="rose" />
                      <ActivityItem user="James W." action="requested access to CRM" time="3h ago" color="amber" />
                   </div>
                   <button className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">View All Logs</button>
                </div>
              </div>

              {/* Secondary Row: Radial Chart & Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Uptime Radial */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center">
                   <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-4">System Uptime</h3>
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="10" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="10" fill="transparent" strokeDasharray="251.2" strokeDashoffset="5.2" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-2xl font-black">98%</span>
                         <span className="text-[10px] font-bold text-slate-400">Stable</span>
                      </div>
                   </div>
                   <p className="mt-4 text-xs font-medium text-slate-500">Perfectly operational in all regions.</p>
                </div>

                {/* Quick Actions Grid */}
                <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 md:col-span-2">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Quick Access</h3>
                      <IconLayout size={20} className="opacity-50" />
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <QuickActionButton label="New Report" icon={<IconClipboard size={18}/>} />
                      <QuickActionButton label="Add User" icon={<IconUserCircle size={18}/>} />
                      <QuickActionButton label="Payments" icon={<IconCurrency size={18}/>} />
                      <QuickActionButton label="Settings" icon={<IconSettings size={18}/>} />
                   </div>
                </div>

              </div>
            </section>

            {/* MODULE SELECTION SECTION (Below Analytics) */}
            <div ref={moduleSectionRef} className="mt-20 pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center mr-3">
                      <IconGrid size={18} />
                    </span>
                    Available Modules
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Select a workspace to begin management</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                   <button className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-xs font-bold shadow-sm">Grid</button>
                   <button className="px-3 py-1.5 text-slate-400 rounded-lg text-xs font-bold">List</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {modules.map((module) => ( <ModuleCard key={module.id} module={module} /> ))}
              </div>
            </div>

            <footer className="mt-32 py-8 border-t border-slate-200/10 dark:border-slate-800/10 text-center text-slate-400 dark:text-slate-600 text-sm font-medium">
              &copy; 2024 Nexus Core Enterprise Portal. Crafted with precision.
            </footer>
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-2">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-3xl flex items-center justify-around h-16 overflow-hidden">
            <MobileNavItem active={activeTab === 'Dashboard'} icon={<IconLayout size={24} />} label="Home" onClick={() => { setActiveTab('Dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            <MobileNavItem active={activeTab === 'All Modules'} icon={<IconGrid size={24} />} label="Modules" onClick={handleBackToModules} />
            <MobileNavItem active={activeTab === 'Notifications'} icon={<IconBell size={24} />} label="Inbox" onClick={() => setActiveTab('Notifications')} />
          </div>
        </nav>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const MetricCard = ({ title, value, trend, icon, color }: any) => {
  const isPositive = trend.startsWith('+');
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:scale-[1.02] transition-all duration-300">
       <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
            {icon}
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {trend}
          </span>
       </div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
       <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{value}</p>
    </div>
  );
};

const ActivityItem = ({ user, action, time, color }: any) => (
  <div className="flex items-start space-x-3">
     <div className={`w-8 h-8 rounded-full bg-${color}-500/10 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-black text-${color}-600 dark:text-${color}-400 shrink-0`}>
        {user.charAt(0)}
     </div>
     <div className="flex-1 overflow-hidden">
        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
           {user} <span className="font-medium text-slate-500">{action}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{time}</p>
     </div>
  </div>
);

const QuickActionButton = ({ label, icon }: any) => (
  <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 active:scale-95 space-y-2">
     <div className="opacity-80">{icon}</div>
     <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const SidebarSection = ({ label, isOpen }: { label: string, isOpen: boolean }) => (
  <div className={`px-4 mb-2 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100 h-6' : 'opacity-0 h-0 pointer-events-none'}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
      {label}
    </p>
  </div>
);

const SidebarLink = ({ icon, label, isOpen, active = false, onClick }: { icon: React.ReactNode, label: string, isOpen: boolean, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center transition-all duration-300 font-bold text-sm rounded-xl relative overflow-hidden group/link ${
    active 
      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' 
      : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 lg:hover:bg-indigo-600/5'
  } ${isOpen ? 'px-4 py-3.5' : 'p-3.5 justify-center'}`}
  >
    {active && (
      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-full"></div>
    )}
    <div className={`flex items-center transition-all duration-500 ${!isOpen ? 'justify-center' : ''}`}>
      <span className={`transition-all duration-300 flex-shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} ${!isOpen ? 'scale-110' : ''}`}> 
        {icon} 
      </span>
      <span className={`whitespace-nowrap transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100 w-auto translate-x-0 ml-3' : 'opacity-0 w-0 -translate-x-4 ml-0'}`}> 
        {label} 
      </span>
    </div>
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
  >
    <div className={`relative transition-transform duration-300 ${active ? '-translate-y-1 scale-110' : ''}`}>
      {icon}
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>}
    </div>
    <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

const DropdownItem = ({ icon, label, variant = 'default', onClick }: { icon: React.ReactNode, label: string, variant?: 'default' | 'danger', onClick?: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-5 py-3.5 text-sm transition-colors ${variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
    <span className="opacity-70">{icon}</span>
    <span className="font-bold">{label}</span>
  </button>
);

export default App;
