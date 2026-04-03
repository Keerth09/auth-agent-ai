"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function NotFound() {
  const [frame, setFrame] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Play animation frames (1 to 67)
  useEffect(() => {
    // We pre-load the next few frames for smoother playback if possible
    const interval = setInterval(() => {
      setFrame((prev) => (prev >= 67 ? 1 : prev + 1));
    }, 1000 / 24); // 24 FPS
    return () => clearInterval(interval);
  }, []);

  // Update mouse position for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Format frame string, e.g. "ezgif-frame-001.jpg"
  const frameString = frame.toString().padStart(3, '0');
  const imageUrl = `/404-frames/ezgif-frame-${frameString}.jpg`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden relative"
      style={{ perspective: "1200px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
        style={{ 
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", 
          backgroundSize: "60px 60px",
          transform: `translateY(${mousePos.y * -20}px) translateX(${mousePos.x * -20}px)` 
        }}
      />

      {/* Dynamic Interactive 3D Scene */}
      <div 
        ref={containerRef}
        className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] transition-transform duration-100 ease-out z-10"
        style={{
          transform: `rotateY(${mousePos.x * 25}deg) rotateX(${mousePos.y * -25}deg)`,
          transformStyle: "preserve-3d"
        }}
      >
        {/* Layer 0: Depth Shadow / Glow */}
        <div 
          className="absolute inset-0 bg-blue-600/30 blur-[60px] rounded-full"
          style={{ transform: "translateZ(-80px) scale(0.9)" }}
        />
        
        {/* Layer 1: Frame Animation rendered on a 3D plane */}
        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,100,255,0.1)] bg-neutral-900"
          style={{ transform: "translateZ(0px)", transformStyle: "preserve-3d" }}
        >
          {/* We use an img tag without next/image wrapper properly because it changes rapidly per frame */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt="404 Dimensional Error" 
            className="w-full h-full object-cover opacity-90 select-none pointer-events-none"
            style={{ mixBlendMode: "screen" }}
          />
          {/* Glossy Refraction Map overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/40 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Layer 2: Floating 3D Text Overlay on Top of the GIF Frame */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          style={{ transform: "translateZ(60px)" }}
        >
          <h1 className="text-8xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 tracking-tighter">
            404
          </h1>
        </div>
      </div>

      {/* Bottom Interface */}
      <div 
        className="mt-16 text-center z-10 transition-transform duration-300 ease-out" 
        style={{ transform: `translateY(${mousePos.y * -10}px)` }}
      >
        <h2 className="text-2xl font-medium text-white mb-3">
          Entity Not Found
        </h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          The requested system node has decoupled from the primary vault. Authorization checks cannot proceed.
        </p>
        
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
        >
          Secure Egress →
        </Link>
      </div>

    </div>
  );
}
