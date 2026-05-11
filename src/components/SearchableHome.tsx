"use client";

import React, { useState, useEffect } from "react";
import MangaGrid from "./MangaGrid";
import HeroBanner from "./HeroBanner";
import Link from "next/link";

interface Manga {
  id?: number;
  title: string;
  author: string;
  image: string;
  banner?: string; // <--- Añadido
  path: string;
  description?: string; // <--- Añadido para el Hero
  latestChapter?: string | number;
  chapter?: string; 
}

interface HistoryItem {
  id: number;
  title: string;
  path: string;
  chapter: string;
  image: string;
}

interface SearchableHomeProps {
  initialData: Manga[];
  showSearch?: boolean;
  view?: "home" | "history" | "search" | "library"; 
}

export default function SearchableHome({ 
  initialData = [], 
  showSearch = true, 
  view = "home" 
}: SearchableHomeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbHistory, setDbHistory] = useState<HistoryItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (Array.isArray(data)) setDbHistory(data);
      } catch (e) {
        console.error("Error cargando historial");
      }
    };
    fetchHistory();
  }, []);

  // --- LÓGICA DE ENRIQUECIMIENTO PARA EL HERO ---
  // Buscamos el manga completo en initialData que coincida con el último leído
  const lastReadItem = dbHistory[0];
  const featuredManga = initialData.find(m => m.path === lastReadItem?.path) || initialData[0];

  // Seleccionamos la fuente de datos para el Grid
  const sourceData = view === "history" ? dbHistory : initialData;
  
  const filteredMangas = (sourceData as any[]).filter((manga) =>
    manga?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-black min-h-screen pb-20 w-full" style={{ touchAction: 'pan-y' }}>
      
      {/* 1. HERO BANNER: Ahora le pasamos el manga ENRIQUECIDO con AniList */}
      {isClient && view === "home" && !searchTerm && (
        <HeroBanner 
          featured={featuredManga} 
          lastReadChapter={lastReadItem?.chapter} 
        />
      )}

      {/* 2. BUSCADOR */}
      {showSearch && (
        <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-6 flex justify-center">
          <div className="relative w-full max-w-3xl">
            <input
              type="text"
              placeholder="Buscar título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-red-600/50 transition-all text-lg font-bold"
            />
          </div>
        </div>
      )}

      {/* 3. VISTA DE RESULTADOS */}
      <div className="mt-2">
        {view === "search" || view === "history" ? (
          <div className="flex flex-col divide-y divide-white/5 px-4 max-w-4xl mx-auto">
            {filteredMangas.map((manga, index) => (
              <Link 
                key={`${manga.title}-${index}`} 
                href={view === "history" 
                  ? `/manga/${encodeURIComponent(manga.path)}/${encodeURIComponent(manga.chapter)}`
                  : `/manga/${encodeURIComponent(manga.path || manga.title)}`
                }
                className="py-5 flex items-center justify-between group active:bg-zinc-900/50 px-4 rounded-xl transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black text-zinc-200 group-hover:text-red-500 transition-colors uppercase italic tracking-tight">
                    {manga.title}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                    {manga.chapter 
                      ? `Leído: ${manga.chapter.replace(/\.(cbz|zip)$/i, "")}` 
                      : (manga.author || "Nexus Library")
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-zinc-700 text-[10px] font-black uppercase tracking-tighter">Continuar</span>
                   <svg className="text-zinc-800" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <MangaGrid initialData={filteredMangas} />
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; }`}} />
    </div>
  );
}