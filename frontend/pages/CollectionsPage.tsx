
import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { Category } from '../lib/mockDb';
import { ArrowLeft, ArrowRight, Loader } from 'lucide-react';

interface Props {
  onNavigate: (page: string, params?: any) => void;
}

export const CollectionsPage: React.FC<Props> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      const res = await api.categories.list();
      if (res.success && res.data) {
        // Only show top-level or significant categories
        const filtered = res.data.filter(c => c.level === 0 || c.level === 1);
        setCategories(filtered);
      }
      setLoading(false);
    };
    fetchCats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <div className="text-center mb-16">
           <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
             CURATED <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">COLLECTIONS</span>
           </h1>
           <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
             Discover our hand-picked selections. Defined by season, style, and substance.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, index) => (
            <div 
              key={cat.id}
              onClick={() => onNavigate('home', { category: cat.slug })}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${index % 3 === 0 ? 'md:col-span-2 aspect-[21/9]' : 'aspect-[4/3]'}`}
            >
              {/* Background Image */}
              <img 
                src={cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80'} 
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base max-w-lg mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {cat.description || `Explore our exclusive range of ${cat.name.toLowerCase()}. Premium quality designed for the modern individual.`}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-sm group-hover:text-blue-400 transition-colors">
                    Explore Collection <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
