import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface LoginPageProps {
  onEnterApp: () => void;
  onOpenLoginModal?: () => void;
}

const CAPABILITIES = [
  { name: 'Neural Embeddings', badge: 'NE' },
  { name: 'Hybrid Vector Search', badge: 'VS' },
  { name: 'Multimodal OCR', badge: 'OCR' },
  { name: 'Grounded Citations', badge: 'GC' },
  { name: 'PDF & DOCX Parser', badge: 'DOC' },
  { name: 'Cosine Re-ranking', badge: 'SIM' },
  { name: 'Semantic Chunking', badge: 'SC' },
  { name: 'Multi-Doc Synthesis', badge: 'RAG' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onEnterApp, onOpenLoginModal }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Custom JS-controlled video fade loop using requestAnimationFrame:
  // 0.5s fade-in at start, 0.5s fade-out at end.
  // On ended, opacity resets to 0, waits 100ms, then replays from 0
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrameId: number;
    let timeoutId: NodeJS.Timeout;
    const fadeDuration = 0.5; // 0.5 seconds

    const updateFade = () => {
      if (!video) return;

      const currentTime = video.currentTime;
      const duration = video.duration;

      if (!isNaN(duration) && duration > 0) {
        // Fade in during first 0.5s
        if (currentTime < fadeDuration) {
          const inOpacity = Math.min(1, Math.max(0, currentTime / fadeDuration));
          video.style.opacity = inOpacity.toFixed(3);
        }
        // Fade out during last 0.5s
        else if (duration - currentTime <= fadeDuration) {
          const remaining = duration - currentTime;
          const outOpacity = Math.min(1, Math.max(0, remaining / fadeDuration));
          video.style.opacity = outOpacity.toFixed(3);
        }
        // Fully visible in between
        else {
          video.style.opacity = '1';
        }
      }

      animFrameId = requestAnimationFrame(updateFade);
    };

    const handleEnded = () => {
      if (!video) return;
      video.style.opacity = '0';
      timeoutId = setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    video.play().catch(() => {});
    animFrameId = requestAnimationFrame(updateFade);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timeoutId) clearTimeout(timeoutId);
      if (video) {
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  const handleAction = () => {
    if (onOpenLoginModal) {
      onOpenLoginModal();
    } else {
      onEnterApp();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Video (Index page wrapper) */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
        muted
        playsInline
        autoPlay
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-none"
        style={{ opacity: 0 }}
      />

      {/* Main Hero Container sitting in relative z-10 with overflow-visible */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between overflow-visible">
        {/* Blurred overlay shape centered behind content */}
        <div className="w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10" />

        {/* Top Navbar */}
        <header className="w-full">
          <div className="w-full py-5 px-8 flex flex-row items-center justify-between">
            {/* Left: Brand Logo */}
            <div
              onClick={onEnterApp}
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
            >
              <div className="h-8 flex items-center">
                {/* Clean inline SVG mark fallback and img reference */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-[#0d091a] rounded-[10px] flex items-center justify-center">
                    <span className="font-general font-bold text-sm bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent">
                      IM
                    </span>
                  </div>
                </div>
                <span className="ml-2.5 font-general font-bold text-lg tracking-tight text-[hsl(var(--foreground))]">
                  IntraMind
                </span>
              </div>
            </div>

            {/* Center: Nav Items */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                type="button"
                onClick={handleAction}
                className="flex items-center space-x-1 text-sm font-medium text-[hsl(var(--foreground))]/90 hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
              >
                <span>RAG Architecture</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              <button
                type="button"
                onClick={handleAction}
                className="text-sm font-medium text-[hsl(var(--foreground))]/90 hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
              >
                Vector Search
              </button>

              <button
                type="button"
                onClick={handleAction}
                className="text-sm font-medium text-[hsl(var(--foreground))]/90 hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
              >
                Document OCR
              </button>

              <button
                type="button"
                onClick={handleAction}
                className="flex items-center space-x-1 text-sm font-medium text-[hsl(var(--foreground))]/90 hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
              >
                <span>Documentation</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </nav>

            {/* Right: Sign Up Button */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleAction}
                className="btn-hero-secondary rounded-full px-4 py-2 text-sm font-medium cursor-pointer active:scale-95"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* 1px divider line with gradient from-transparent via-foreground/20 to-transparent, offset mt-[3px] */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[hsl(var(--foreground))]/20 to-transparent mt-[3px]" />
        </header>

        {/* Hero Content (vertically centered in remaining space via flex-1) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 relative">
          {/* Headline: "IntraMind" (replacing "Power AI" per prompt specifications) */}
          <h1 className="font-general font-normal leading-[1.02] tracking-[-0.024em] text-[clamp(4.2rem,15vw,220px)] select-none">
            <span className="text-[hsl(var(--foreground))]">Intra</span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)',
              }}
            >
              Mind
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[hsl(var(--hero-sub))] text-base sm:text-lg leading-8 max-w-lg mt-[9px] opacity-90 font-sans">
            Enterprise Neural RAG & Multi-Format
            <br className="hidden sm:inline" /> Document Intelligence Engine
          </p>

          {/* CTA: "Launch RAG Workspace" button */}
          <button
            type="button"
            onClick={onEnterApp}
            className="btn-hero-secondary px-[32px] py-[20px] mt-[25px] rounded-full text-base font-medium cursor-pointer shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2.5"
          >
            <span>Launch RAG Workspace</span>
          </button>
        </main>

        {/* Capabilities marquee pinned to bottom of hero, pb-10 */}
        <footer className="w-full pb-10 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            {/* Left side: static text */}
            <div className="text-[hsl(var(--foreground))]/60 text-sm text-center md:text-left leading-snug shrink-0 font-medium">
              Powered by advanced
              <br />
              Neural RAG architecture
            </div>

            {/* Right side: infinite scrolling marquee */}
            <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] w-full">
              <div className="animate-marquee flex items-center gap-12">
                {[...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 shrink-0 select-none">
                    <div className="liquid-glass px-2 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-[hsl(var(--foreground))] tracking-wider">
                      {item.badge}
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
