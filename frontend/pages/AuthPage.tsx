
import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { User } from '../lib/mockDb';
import { ArrowLeft, Info } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<Props> = ({ onLogin, onNavigate, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login({ email: formData.email, password: formData.password });
        if (res.success && res.data) {
          onLogin(res.data);
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await api.auth.register({ ...formData, role: 'customer' });
        if (res.success && res.data) {
          onLogin(res.data);
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'customer') => {
    if (type === 'admin') {
      setFormData({ ...formData, email: 'admin@fashion.com', password: 'password123' });
    } else {
      setFormData({ ...formData, email: 'jane@example.com', password: 'password123' });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Left Side - Image */}
      <div className="hidden lg:block w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80" 
          alt="Auth Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
        <div className="absolute bottom-12 left-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Join the Movement.</h2>
          <p className="text-lg text-gray-200 max-w-md">Experience fashion re-imagined. Exclusive drops, early access, and curated styles just for you.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative overflow-y-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="absolute top-8 left-8 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Store
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Ms<span className="text-blue-600 dark:text-blue-500">.</span>Yatta</h1>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Or{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                {isLogin ? 'Create a new account' : 'sign in to your existing account'}
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded p-3 text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>
          
          <div className="mt-8 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
             <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <Info size={16} />
                <span className="text-sm font-bold">Demo Mode</span>
             </div>
             <p className="text-xs text-gray-500 mb-3">Click to auto-fill credentials:</p>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => fillCredentials('customer')}
                 className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded border border-gray-300 dark:border-gray-700 transition-colors text-left"
               >
                 <span className="block font-bold text-gray-900 dark:text-white">Customer</span>
                 jane@example.com
               </button>
               <button 
                 onClick={() => fillCredentials('admin')}
                 className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded border border-gray-300 dark:border-gray-700 transition-colors text-left"
               >
                 <span className="block font-bold text-gray-900 dark:text-white">Admin</span>
                 admin@fashion.com
               </button>
             </div>
          </div>
          
          <div className="text-center">
             <p className="text-xs text-gray-500 dark:text-gray-600">
               By continuing, you agree to our Terms of Service and Privacy Policy.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
