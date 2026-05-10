"use client";

import React from 'react';
import { Home, Bookmark, Search, History } from "lucide-react";

interface BottomNavProps {
  currentView: string;
  setView: (view: string) => void;
}

export default function BottomNav({ currentView, setView }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'library', label: 'Biblioteca', icon: Bookmark }, // <--- SOLUCIÓN C: Nombre Correcto
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'history', label: 'Historial', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-black/95 border-t border-white/10 backdrop-blur-xl pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            // 'relative' es necesario para que el punto rojo se posicione bien abajo
            // 'active:scale-90' da el feedback táctil que pediste para la APK
            className={`relative flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${
              currentView === item.id ? 'text-red-600' : 'text-zinc-500'
            }`}
          >
            <item.icon 
              size={22} 
              strokeWidth={currentView === item.id ? 3 : 2} 
              className="transition-transform duration-200"
            />
            
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">
              {item.label}
            </span>
            
            {/* Punto indicador para la vista activa: Animado y centrado */}
            {currentView === item.id && (
              <div className="absolute bottom-1 w-1 h-1 bg-red-600 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}