import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X, Sparkles, Lock, Mail, Shield, Search, Database, FileText, Cpu, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onEnterApp: () => void;
  onOpenLoginModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onEnterApp }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Continuous loop video handling without black fade pauses
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is playing continuously
    const handlePlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    video.play().catch(() => {});
    window.addEventListener('focus', handlePlay);

    return () => {
      window.removeEventListener('focus', handlePlay);
    };
  }, []);

  const ragFeatures = [
    { name: 'Vector Search Engine', label: 'RAG' },
    { name: 'Semantic Document Chunking', label: 'AI' },
    { name: 'Citation Grounding & Verification', label: 'DOC' },
    { name: 'Multi-PDF Knowledge Intelligence', label: 'CTX' },
    { name: 'Gemini Embeddings Indexing', label: 'VEC' },
    { name: 'Hybrid Contextual Retrieval', label: 'RAG' },
  ];

  // Duplicate list for seamless infinite marquee loop
  const duplicatedFeatures = [...ragFeatures, ...ragFeatures, ...ragFeatures];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuthModal(false);
    onEnterApp();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[hsl(260_87%_3%)] text-[hsl(40_6%_95%)] overflow-x-hidden font-sans select-none">
      {/* Background Video Wrapper - Seamless Continuous Loop */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-300"
        />
      </div>

      {/* Hero Section Container with overflow-visible so central blur is not clipped */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between overflow-visible">
        
        {/* Blurred Overlay Shape (Centered behind content) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] max-w-[90vw] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none rounded-full" 
        />

        {/* Navbar */}
        <header className="w-full relative z-20">
          <div className="w-full py-5 px-6 sm:px-8 flex flex-row items-center justify-between">
            {/* Left: Brand Logo & Name */}
            <div 
              onClick={onEnterApp}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg liquid-glass flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                <span className="font-general font-bold text-lg text-white">I</span>
              </div>
              <span className="font-general font-semibold text-xl tracking-tight text-white">
                IntraMind
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onEnterApp}
                className="hidden sm:inline-block text-xs font-medium text-white/80 hover:text-white px-3 py-2 transition-colors cursor-pointer"
              >
                Launch Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setShowAuthModal(true);
                }}
                className="btn-hero-secondary rounded-full px-4 py-2 text-sm font-medium cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* 1px divider line with gradient */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[hsl(40_6%_95%)]/20 to-transparent mt-[3px]" />
        </header>

        {/* Hero Content (Vertically centered via flex-1) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative z-10 py-6 sm:py-10">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            
            {/* Headline: "IntraMind AI" optimized to stay on 1 line and unhide CTA button */}
            <h1 className="font-general font-normal text-[44px] sm:text-[72px] md:text-[96px] lg:text-[120px] xl:text-[136px] leading-none tracking-[-0.03em] text-[hsl(40_6%_95%)] select-none whitespace-nowrap">
              <span>IntraMind </span>
              <span 
                className="bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)',
                }}
              >
                AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[hsl(40_6%_85%)] text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mt-3 opacity-90 font-sans font-normal">
              The most powerful AI ever deployed in document intelligence & knowledge management
            </p>

            {/* Prominent Unhidden CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
              <button
                type="button"
                onClick={onEnterApp}
                className="btn-hero-secondary px-8 py-4 sm:py-5 rounded-full font-semibold text-base sm:text-lg flex items-center space-x-3 cursor-pointer shadow-2xl hover:scale-105 active:scale-95 transition-all ring-2 ring-purple-500/30"
              >
                <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                <span>Explore RAG Studio & Workspace</span>
                <ArrowRight className="w-5 h-5 ml-1 text-purple-200" />
              </button>
            </div>
          </div>
        </main>

        {/* Logo Marquee (Pinned to bottom of hero, pb-10) */}
        <footer className="w-full relative z-10 pb-10 px-6 sm:px-10">
          <div className="w-full flex flex-col md:flex-row items-center gap-6 md:gap-12">
            
            {/* Left side: Static relevant sentence */}
            <div className="text-[hsl(40_6%_95%)]/80 text-xs sm:text-sm font-medium text-center md:text-left flex-shrink-0 max-w-xs leading-snug">
              Real-time knowledge retrieval & vector document intelligence
            </div>

            {/* Right side: Infinite scrolling RAG feature marquee */}
            <div className="overflow-hidden w-full relative mask-linear-fade">
              <div className="animate-marquee flex items-center gap-12">
                {duplicatedFeatures.map((feat, idx) => (
                  <div 
                    key={`${feat.name}-${idx}`} 
                    className="flex items-center space-x-3 flex-shrink-0 cursor-pointer hover:opacity-100 opacity-85 transition-opacity"
                  >
                    <div className="liquid-glass px-2 py-0.5 rounded-md flex items-center justify-center font-bold text-[10px] text-purple-300 border border-white/15">
                      {feat.label}
                    </div>
                    <span className="text-sm font-medium text-[hsl(40_6%_95%)] tracking-tight">
                      {feat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </footer>

      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0f0b1a] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-9 rounded-xl liquid-glass border border-white/20 flex items-center justify-center font-general font-bold text-xl text-white">
                I
              </div>
              <span className="font-general font-semibold text-2xl tracking-tight text-white">
                IntraMind AI
              </span>
            </div>

            <h2 className="font-general font-semibold text-2xl text-white">
              {isSignUp ? 'Create your IntraMind account' : 'Sign In to IntraMind AI'}
            </h2>
            <p className="text-xs text-white/60 mt-1 mb-6">
              {isSignUp
                ? 'Get instant enterprise access to private RAG & vector document search'
                : 'Enter your credentials or test with 1-click guest access'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="executive@company.com"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-medium text-sm py-3 rounded-full transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center justify-center space-x-2 mt-2"
              >
                <span>{isSignUp ? 'Get Started Now' : 'Enter IntraMind RAG Engine'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#0f0b1a] px-3 text-[11px] font-mono text-white/40 uppercase">
                Or Quick Access
              </span>
            </div>

            <button
              type="button"
              onClick={onEnterApp}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-medium text-xs py-2.5 rounded-full transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Launch Demo Workspace Instantly</span>
            </button>

            <div className="mt-6 text-center text-xs text-white/50">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-white font-semibold hover:underline cursor-pointer"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
