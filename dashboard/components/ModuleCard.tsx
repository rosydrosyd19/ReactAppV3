
import React from 'react';
import { Module } from '../types';

interface ModuleCardProps {
  module: Module;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  return (
    <div className={`group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 opacity-5 group-hover:opacity-20 transition-all duration-700 bg-${module.color}-500 rounded-full blur-3xl`}></div>
      
      <div className="flex flex-col h-full space-y-5 relative z-10">
        <div className={`p-4 w-fit rounded-2xl bg-white/80 dark:bg-slate-700/80 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm`}>
          {module.icon}
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {module.title}
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
            {module.description}
          </p>
        </div>

        <div className="mt-auto pt-6 flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          Open Module
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </div>
  );
};