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
          className="relative w-full max-w-md bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 p-6 sm:p-8 z-10 overflow-hidden text-white"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>

          {/* Logo header with Portal Brand Logo */}
          <div className="flex items-center space-x-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <div className="w-full h-full bg-[#0a0714] rounded-[10px] flex items-center justify-center">
                <span className="font-general font-bold text-xs bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent select-none">
                  IM
                </span>
              </div>
            </div>
            <span className="font-general font-semibold text-2xl tracking-tight text-white">
              IntraMind AI
            </span>
          </div>

          <h2 className="font-general text-2xl font-semibold text-white">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 mb-6">
            {isSignUp
              ? 'Access private document intelligence & RAG vector search'
              : 'Sign in to access your personal workspace & AI tools'}
          </p>

          {error && (
            <div className="mb-4 text-xs bg-red-950/60 text-red-300 p-2.5 rounded-lg border border-red-800/60">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm py-3 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-2 cursor-pointer"
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
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative bg-neutral-950 px-3 text-[11px] font-mono text-neutral-500 uppercase">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={() => onLoginSuccess('guest@intramind.ai')}
            className="w-full bg-neutral-900 hover:bg-neutral-850 text-neutral-200 hover:text-white border border-neutral-800 font-medium text-xs py-2.5 rounded-full transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
          >
            <span>Continue as Guest Demo</span>
          </button>

          {/* Switch toggle */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
