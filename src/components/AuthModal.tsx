import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, ShoppingBag } from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login', showToast }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorVisible('');

    try {
      if (mode === 'login') {
        const response = await api.auth.login(email, password);
        setAuthToken(response.token);
        onAuthSuccess(response.user);
        showToast(`Welcome back, ${response.user.name}!`, 'success');
        onClose();
      } else {
        const response = await api.auth.register(name, email, password);
        setAuthToken(response.token);
        onAuthSuccess(response.user);
        showToast(`Account created! Welcome, ${response.user.name}!`, 'success');
        onClose();
      }
    } catch (err: any) {
      setErrorVisible(err.message || 'An error occurred during authentication.');
      showToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100"
      >
        {/* Header / Logo section */}
        <div className="relative p-6 text-center text-white bg-gradient-to-r from-amber-500 to-orange-600">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="flex justify-center items-center gap-2 mb-2">
            <ShoppingBag className="w-8 h-8 text-white drop-shadow-sm" />
            <span className="text-2xl font-black tracking-tight uppercase">
              Super<span className="text-amber-200">Cart</span>
            </span>
          </div>
          <p className="text-sm text-amber-50 font-light">
            {mode === 'login' ? 'Sign in to access your orders, cart & wishlist' : 'Create an account for personalized shopping'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorVisible && (
            <div className="p-3 mb-4 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200">
              {errorVisible}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => showToast('Password reset is simulated. Use user@ecommerce.com / user123 or admin@ecommerce.com / admin123', 'success')}
                    className="text-xs text-orange-600 hover:underline font-semibold"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/10 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Helper details for effortless evaluation */}
          <div className="mt-4 p-2.5 bg-amber-50/50 rounded-lg border border-amber-100 text-center text-[11px] text-amber-800">
            <strong>Demonstration Logins:</strong><br />
            Customer: <code className="font-mono bg-white px-1">user@ecommerce.com</code> / <code className="font-mono bg-white px-1">user123</code><br />
            Admin: <code className="font-mono bg-white px-1">admin@ecommerce.com</code> / <code className="font-mono bg-white px-1">admin123</code>
          </div>

          <div className="mt-5 pt-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-1 text-xs text-orange-600 font-bold hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
