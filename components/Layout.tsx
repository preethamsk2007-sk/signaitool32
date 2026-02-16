
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, headerActions }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-600 tracking-tighter">
                SignEase
              </span>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Intelligence</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden lg:flex space-x-8 mr-6 border-r border-slate-200 dark:border-slate-800 pr-8">
              <a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">Methods</a>
              <a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">Project Info</a>
            </nav>
            {headerActions}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium text-center md:text-left">
            © 2024 College Capstone - SignEase AI Recognition System
          </p>
          <div className="flex space-x-6 text-slate-400 dark:text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
