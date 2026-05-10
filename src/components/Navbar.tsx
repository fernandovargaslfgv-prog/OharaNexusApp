"use client";
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-40 bg-black/95 backdrop-blur-md border-b border-white/5 
                    pt-[calc(env(safe-area-inset-top,0px)+2px)] pb-2"> 
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="bg-red-600 text-white font-black px-3 py-1 italic rounded-sm text-sm">
             OHARA
           </div>
           <span className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase">Nexus</span>
        </div>
      </div>
    </nav>
  );
}