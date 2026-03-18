
import React, { useState, useEffect } from 'react';
import { ShoppingBag, LogOut, Shield, User as UserIcon, Sun, Moon } from 'lucide-react';
import { User } from '../lib/mockDb';
import { useTheme } from '../context/ThemeContext';

interface Props {
  user: User | null;
  cartCount: number;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<Props> = ({ user, cartCount, onNavigate, onLogout, onOpenCart }) => {
  const { theme, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Show navbar if scrolling up or at the very top
        if (window.scrollY < lastScrollY || window.scrollY < 50) {
          setIsVisible(true);
        } else {
          // Hide navbar if scrolling down and not at the top
          setIsVisible(false);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const handleLogoClick = () => {
    if (user?.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('home');
    }
  };

  return (
    <nav 
      className={`sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
            <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
              Ms<span className="text-blue-600 dark:text-blue-500">.</span>Yatta
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => onNavigate('home')} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">Shop</button>
            <button onClick={() => onNavigate('collections')} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">Collections</button>
            
            {user?.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')} 
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-blue-200 dark:border-blue-500/20"
              >
                <Shield size={12} /> Admin Panel
              </button>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => onNavigate('profile')}
                   className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                 >
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-700/50">
                     <span className="font-bold text-blue-600 dark:text-blue-400">{user.name.charAt(0).toUpperCase()}</span>
                   </div>
                   <span className="hidden sm:block font-medium">{user.name.split(' ')[0]}</span>
                 </button>
                 <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700"></div>
                 <button onClick={onLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-white transition-colors" title="Logout">
                   <LogOut size={20} />
                 </button>
              </div>
            ) : (
              <button onClick={() => onNavigate('login')} className="text-sm font-medium text-white bg-black dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 px-4 py-2 rounded-full transition-colors">
                Sign In
              </button>
            )}

            <button 
              onClick={onOpenCart}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <ShoppingBag size={22} className="group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
