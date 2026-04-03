"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Shield, Activity, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none" />
      
      {/* Large Decorative 4s */}
      <div className="absolute inset-0 flex items-center justify-between px-10 md:px-20 select-none pointer-events-none">
        {/* Left 4 */}
        <div className="relative">
          <span className="text-white font-syne font-black text-[25vw] leading-none opacity-100">4</span>
          {/* Top-left arrow */}
          <div className="absolute -top-[5%] -right-[15%] text-red-500 animate-pulse">
             <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10 L40 10 L40 25 L25 25 L25 80 L10 80 Z" transform="rotate(135 50 50)" />
             </svg>
          </div>
        </div>

        {/* Right 4 */}
        <div className="relative">
          <span className="text-white font-syne font-black text-[25vw] leading-none opacity-100">4</span>
          {/* Bottom-right arrow */}
          <div className="absolute -bottom-[5%] -left-[15%] text-red-500 animate-pulse">
             <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10 L40 10 L40 25 L25 25 L25 80 L10 80 Z" transform="rotate(-45 50 50)" />
             </svg>
          </div>
        </div>
      </div>

      {/* Center Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[32px] p-10 text-center shadow-2xl mx-6">
        <p className="text-gray-500 font-medium text-sm mb-2 tracking-widest uppercase">
          ... 404 error ...
        </p>
        <h1 className="text-black font-syne font-bold text-4xl mb-6 leading-tight">
          Sorry, page not <br/> found
        </h1>
        <p className="text-gray-400 text-sm mb-10 px-4">
          Go to other sections to learn more about VaultProxy Security
        </p>

        <div className="flex flex-col gap-3">
          {/* Links */}
          <Link 
            href="/dashboard"
            className="group flex items-center justify-between p-5 bg-gray-50 rounded-2xl transition-all hover:bg-red-50"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="bg-red-100 p-2.5 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-black font-bold text-sm">Control Center</h3>
                <p className="text-gray-400 text-[11px]">System wide security oversight</p>
              </div>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-red-500 transition-colors" />
          </Link>

          <Link 
            href="/dashboard/run"
            className="group flex items-center justify-between p-5 bg-gray-50 rounded-2xl transition-all hover:bg-red-50"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="bg-gray-200 p-2.5 rounded-xl text-gray-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-black font-bold text-sm">Agent Terminal</h3>
                <p className="text-gray-400 text-[11px]">Execute and monitor live agents</p>
              </div>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-red-500 transition-colors" />
          </Link>

          <Link 
            href="/dashboard/audit"
            className="group flex items-center justify-between p-5 bg-gray-50 rounded-2xl transition-all hover:bg-red-50"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="bg-gray-200 p-2.5 rounded-xl text-gray-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-black font-bold text-sm">Immutable Ledger</h3>
                <p className="text-gray-400 text-[11px]">Review system wide audit logs</p>
              </div>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-red-500 transition-colors" />
          </Link>
        </div>

        <div className="mt-8">
           <Link href="/" className="text-xs font-bold text-gray-300 hover:text-black transition-colors uppercase tracking-widest">
             Return to safety
           </Link>
        </div>
      </div>

      <style jsx>{`
        .font-syne {
          font-family: 'Syne', sans-serif;
        }
      `}</style>
    </div>
  );
}
