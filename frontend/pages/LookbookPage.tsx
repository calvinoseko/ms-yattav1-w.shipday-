
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

export const LookbookPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-20 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>
        
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50 dark:bg-gray-900/50">
           <h1 className="text-4xl font-black text-gray-200 dark:text-gray-800 mb-4 tracking-tighter">LOOKBOOK</h1>
           <p className="text-gray-400 font-medium">Content coming soon...</p>
        </div>
      </div>
    </div>
  );
};
