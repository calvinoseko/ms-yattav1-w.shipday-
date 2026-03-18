
import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/apiClient';
import { Product, Category } from '../lib/mockDb';
import { Filter, Search, ChevronRight, ChevronUp } from 'lucide-react';

interface Props {
  onAddToCart: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  initialCategory?: string | null;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<Props> = ({ onAddToCart, onViewProduct, initialCategory, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Navbar sync state
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Sync with initialCategory prop when it changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      // Scroll to shop section
      const shopSection = document.getElementById('shop-section');
      if (shopSection) {
         shopSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
        setSelectedCategory('');
    }
  }, [initialCategory]);

  // Scroll listener for back to top button and navbar sync
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Back to top logic
      if (currentScrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }

      // Navbar Sync Logic (matches Navbar.tsx behavior)
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsNavbarVisible(true);
      } else {
        setIsNavbarVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      const res = await api.categories.list();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await api.products.list({ 
        categoryPath: selectedCategory || undefined,
        search: searchQuery || undefined
      });
      if (res.success && res.data) {
        setProducts(res.data);
      }
      setLoading(false);
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const rootCategories = categories.filter(c => c.level === 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative bg-gray-200 dark:bg-gray-900 h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Fashion Hero" 
            className="w-full h-full object-cover opacity-50 dark:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-black via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
            DEFINE YOUR <br />
            <span className="text-blue-600 dark:text-blue-500">STYLE.</span>
          </h1>
          <p className="text-xl text-gray-800 dark:text-gray-300 max-w-xl mb-8 font-medium">
            Explore our latest collection of premium streetwear, curated for the modern individual. Quality meets aesthetic.
          </p>
          <div className="flex gap-4">
             <button 
               onClick={() => {
                   document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' });
               }}
               className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors shadow-lg"
             >
                Shop Collection
             </button>
             <button 
               onClick={() => onNavigate('lookbook')}
               className="border border-gray-900/30 dark:border-white/30 text-gray-900 dark:text-white backdrop-blur-sm px-8 py-3 rounded-full font-bold hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
             >
                View Lookbook
             </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div 
        id="shop-section" 
        className={`sticky z-40 bg-white/95 dark:bg-black/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur transition-all duration-500 ease-in-out ${isNavbarVisible ? 'top-16' : 'top-0'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="font-bold text-lg">
                {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : 'All Products'}
              </span>
              <span className="text-gray-500 text-sm">({products.length})</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search products..." 
                   className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:border-blue-500 w-64 transition-all"
                 />
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === '' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800'}`}
            >
              All
            </button>
            {rootCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.slug ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="bg-white dark:bg-gray-900 rounded-xl h-[500px] animate-pulse border border-gray-200 dark:border-gray-800" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.length > 0 ? products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
                onViewProduct={onViewProduct}
              />
            )) : (
              <div className="col-span-full text-center py-20 text-gray-500">
                No products found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-500 transition-all duration-300 z-50 ${showBackToTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-50 pointer-events-none'}`}
        title="Back to Top"
      >
        <ChevronUp size={24} />
      </button>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-900 py-12 mt-12 transition-colors duration-300">
         <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2023 Ms.Yatta. Powered by Node.js Backend.</p>
         </div>
      </footer>
    </div>
  );
};
