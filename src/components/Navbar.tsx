"use client";
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[100]">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-red-600 text-white font-black px-3 py-1 rounded-lg italic tracking-tighter text-xl shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            OHARA
          </div>
          <span className="text-white font-black tracking-[0.3em] text-[10px] hidden sm:block ml-1">NEXUS</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center cursor-pointer hover:border-red-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </div>
    </nav>
  );
}