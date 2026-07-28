import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(email);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#EDEEF5] rounded-2xl shadow-2xl border border-white/60 p-6 sm:p-8 z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/60 hover:bg-white text-[#1a1a1a] flex items-center justify-center transition-colors"
          >
            ✕
          </button>

          {/* Logo header */}
          <div className="flex items-center space-x-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg font-general">
              I
            </div>
            <span className="font-general font-semibold text-2xl tracking-tight text-slate-900">
              IntraMind AI
            </span>
          </div>

          <h2 className="font-general text-2xl font-semibold text-slate-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            {isSignUp
              ? 'Access private document intelligence & RAG vector search'
              : 'Sign in to access your personal workspace & AI tools'}
          </p>

          {error && (
            <div className="mb-4 text-xs bg-red-100 text-red-700 p-2.5 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-white/80 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-brand-green/80"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/80 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-brand-green/80"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/80 border border-black/10 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-brand-green/80"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1a1a1a] hover:bg-black text-white font-medium text-sm py-3 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md flex items-center justify-center space-x-2 mt-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'} →</span>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10" />
            </div>
            <span className="relative bg-[#EDEEF5] px-3 text-[11px] font-mono text-[#8e8e8e] uppercase">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={() => onLoginSuccess('guest@intramind.ai')}
            className="w-full bg-white/70 hover:bg-white text-[#1a1a1a] border border-black/10 font-medium text-xs py-2.5 rounded-full transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Continue as Guest Demo</span>
          </button>

          {/* Switch toggle */}
          <div className="mt-6 text-center text-xs text-[#8e8e8e]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[#1a1a1a] font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
