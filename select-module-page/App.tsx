
import React, { useState, useEffect } from 'react';
import { Theme, User, Module } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { ModuleCard } from './components/ModuleCard';
import { getAIGreeting } from './services/geminiService';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [user] = useState<User>({ name: 'John Doe', role: 'Super Admin' });
  const [aiMessage, setAiMessage] = useState<string>('Welcome back!');

  useEffect(() => {
    // Check system preference or saved preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === Theme.DARK);
    }

    // Fetch AI Greeting
    const fetchGreeting = async () => {
      const msg = await getAIGreeting(user.name);
      setAiMessage(msg);
    };
    fetchGreeting();
  }, [user.name]);

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === Theme.DARK);
  };

  const modules: Module[] = [
    {
      id: 'asset-management',
      title: 'Asset Management',
      description: 'Track, organize, and monitor enterprise assets, hardware, and inventory across all departments.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: '/assets',
      color: 'blue'
    },
    {
      id: 'hr-management',
      title: 'HR Management',
      description: 'Streamline employee data, manage leave requests, payroll processing, and talent acquisition.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/hr',
      color: 'emerald'
    },
    {
      id: 'finance-accounting',
      title: 'Finance & Accounting',
      description: 'Oversee corporate budgets, track real-time expenses, generate financial statements, and manage accounts.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/finance',
      color: 'rose'
    },
    {
      id: 'crm-sales',
      title: 'CRM & Sales',
      description: 'Manage customer relationships, track sales pipelines, monitor lead conversions, and analyze trends.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      path: '/crm',
      color: 'amber'
    },
    {
      id: 'project-management',
      title: 'Project Management',
      description: 'Coordinate tasks, manage team workflows, track milestones, and ensure on-time delivery of projects.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      path: '/projects',
      color: 'teal'
    },
    {
      id: 'sys-admin',
      title: 'System Administrator',
      description: 'Manage user permissions, system configurations, audit logs, and security protocols.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      path: '/admin',
      color: 'indigo'
    }
  ];

  const handleLogout = () => {
    alert("Logging out...");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === Theme.DARK ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline-block">OmniSuite</span>
        </div>

        <div className="flex items-center space-x-2 md:space-x-6">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Welcome, {user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{user.role}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="group flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-medium text-sm"
            >
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Destination</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {aiMessage} Select a module to begin managing your enterprise operations.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center">
          <p className="text-slate-400 dark:text-slate-600 text-sm">
            &copy; 2024 OmniSuite Enterprise Solutions. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
