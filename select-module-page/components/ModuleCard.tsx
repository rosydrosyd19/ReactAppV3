
import React from 'react';
import { Module } from '../types';

interface ModuleCardProps {
  module: Module;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  return (
    <div className={`group relative p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-pointer overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-${module.color}-500 rounded-full`}></div>
      
      <div className="flex flex-col h-full space-y-4">
        <div className={`p-3 w-fit rounded-xl bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300`}>
          {module.icon}
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {module.title}
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {module.description}
          </p>
        </div>

        <div className="mt-auto pt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          Launch Module
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </div>
  );
};
