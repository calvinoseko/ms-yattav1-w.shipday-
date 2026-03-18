
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProductPage } from './pages/ProductPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { LookbookPage } from './pages/LookbookPage';
import { CartSidebar } from './components/CartSidebar';
import { User, Product, CartItem } from './lib/mockDb';
import { api } from './lib/apiClient';
import { Loader } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';

// Router Type
type Page = 'home' | 'login' | 'checkout' | 'admin' | 'profile' | 'product-detail' | 'collections' | 'lookbook';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [targetCategory, setTargetCategory] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  
  // Cart State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Direct Buy State
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);

  // Effect: Session Persistence & Validation
  useEffect(() => {
    const checkSession = async () => {
        const savedUserStr = localStorage.getItem('nexus_user_session');
        if (savedUserStr) {
            try {
                const parsedUser = JSON.parse(savedUserStr);
                const res = await api.auth.me(parsedUser.token);
                
                if (res.success && res.data) {
                    setCurrentUser(res.data);
                    const cartRes = await api.cart.get(res.data.token);
                    if (cartRes.success && cartRes.data) {
                        setCart(cartRes.data);
                    }
                } else {
                    localStorage.removeItem('nexus_user_session');
                    setCurrentUser(null);
                }
            } catch (e) {
                console.error("Session parse error", e);
                localStorage.removeItem('nexus_user_session');
                setCurrentUser(null);
            }
        }
        setAuthChecking(false);
    };

    checkSession();
  }, []);

  // Effect: Sync Cart with Backend
  useEffect(() => {
    if (!authChecking && currentUser) {
        api.cart.sync(cart, currentUser.token);
    }
  }, [cart, currentUser, authChecking]);

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'login') {
        setAuthInitialMode('login'); 
    }

    if (page === 'home') {
        // If navigating to home, allow setting initial category
        setTargetCategory(params?.category || null);
    } else {
        setTargetCategory(null);
    }

    if (page === 'product-detail' && params?.productId) {
      setSelectedProductId(params.productId);
      setCurrentPage('product-detail');
      return;
    }

    if (['home', 'login', 'checkout', 'admin', 'profile', 'collections', 'lookbook'].includes(page)) {
        setCurrentPage(page as Page);
    } else {
        setCurrentPage('home'); 
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setCurrentPage('product-detail');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user_session', JSON.stringify(user));
    
    api.cart.get(user.token).then(res => {
        if (res.success && res.data) setCart(res.data);
    });

    if (user.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    localStorage.removeItem('nexus_user_session');
    setCurrentPage('home'); 
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    setCart(prev => {
      // Find existing item with SAME ID, Size, and Color
      const existing = prev.find(item => 
        item.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
      );

      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Crude check, ideally check variant stock
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === size && item.selectedColor === color)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, size?: string, color?: string) => {
    if (!currentUser) {
        setAuthInitialMode('register');
        setCurrentPage('login');
        return;
    }
    setDirectCheckoutItem({ ...product, quantity: 1, selectedSize: size, selectedColor: color });
    setIsCartOpen(false);
    setCurrentPage('checkout');
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => 
        !(item.id === id && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const handleCartCheckout = () => {
    if (!currentUser) {
      setAuthInitialMode('register');
      setIsCartOpen(false);
      setCurrentPage('login');
      return;
    }
    setDirectCheckoutItem(null);
    setIsCartOpen(false);
    setCurrentPage('checkout');
  };

  const handleOrderSuccess = () => {
      if (!directCheckoutItem) {
          setCart([]);
      }
      setDirectCheckoutItem(null);
  };

  if (authChecking) {
      return (
          <div className="bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <Loader className="animate-spin text-blue-500" size={32} />
                  <p className="text-gray-500 dark:text-gray-400 text-sm tracking-wider">INITIALIZING MS.YATTA...</p>
              </div>
          </div>
      );
  }

  const itemsForCheckout = directCheckoutItem ? [directCheckoutItem] : cart;

  let content;
  if (currentPage === 'login') {
    content = <AuthPage onLogin={handleLogin} onNavigate={handleNavigate} initialMode={authInitialMode} />;
  } else if (currentPage === 'checkout') {
    content = (
      <CheckoutPage 
        items={itemsForCheckout} 
        user={currentUser} 
        onNavigate={handleNavigate} 
        onOrderSuccess={handleOrderSuccess} 
        isDirectBuy={!!directCheckoutItem}
      />
    );
  } else if (currentPage === 'product-detail' && selectedProductId) {
    content = (
      <ProductPage 
        productId={selectedProductId} 
        onNavigate={handleNavigate} 
        onAddToCart={addToCart} 
        onBuyNow={handleBuyNow}
        onViewProduct={handleViewProduct}
      />
    );
  } else if (currentPage === 'admin') {
    if (currentUser?.role === 'admin') {
      content = <AdminPage user={currentUser} onNavigate={handleNavigate} />;
    } else {
      content = <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white">Unauthorized Access</div>;
      setTimeout(() => setCurrentPage('home'), 1000);
    }
  } else if (currentPage === 'profile') {
    if (currentUser) {
      content = <ProfilePage user={currentUser} onUpdateUser={setCurrentUser} onNavigate={handleNavigate} />;
    } else {
      handleNavigate('login');
    }
  } else if (currentPage === 'collections') {
      content = <CollectionsPage onNavigate={handleNavigate} />;
  } else if (currentPage === 'lookbook') {
      content = <LookbookPage onNavigate={handleNavigate} />;
  } else {
    content = (
        <HomePage 
            onAddToCart={addToCart} 
            onViewProduct={handleViewProduct} 
            initialCategory={targetCategory}
            onNavigate={handleNavigate}
        />
    );
  }

  if (currentPage === 'login') return <div className="bg-white dark:bg-black min-h-screen">{content}</div>;

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
      <Navbar 
        user={currentUser} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {content}

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={removeFromCart}
        onCheckout={handleCartCheckout}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
