"use client";

import React, { useState, useEffect } from "react";
import MangaGrid from "./MangaGrid";
import { useBookmarks } from "@/hooks/useBookmarks";
import Link from "next/link";

interface Manga {
  title: string;
  author: string;
  image: string;
  cover?: string; // Soportamos ambos nombres de propiedad
  latestChapter: string | number;
  chapter?: string; 
}

interface SearchableHomeProps {
  initialData: Manga[];
  showSearch?: boolean;
  showLibrary?: boolean;
  view?: string; 
}

export default function SearchableHome({ 
  initialData = [], 
  showSearch = true, 
  showLibrary = false,
  view = "home" 
}: SearchableHomeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { getAllBookmarks } = useBookmarks();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const allBookmarks = getAllBookmarks();
  
  // Filtramos la data que llega por el buscador de texto
  const filteredMangas = initialData.filter((manga) =>
    manga?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-black min-h-screen pb-20 w-full" style={{ touchAction: 'pan-y' }}>
      
      {/* 1. BUSCADOR */}
      {showSearch && (
        <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-6 flex justify-center">
          <div className="relative w-full max-w-3xl">
            <input
              type="text"
              placeholder="Buscar título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-red-600/50 transition-all text-lg"
            />
          </div>
        </div>
      )}

      {/* 2. CARRUSEL "MI ESTANTE" (Opcional, solo si showLibrary es true) */}
      {isClient && showLibrary && !searchTerm && initialData.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-8 animate-in fade-in duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white font-serif">Mi Estante</h2>
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x" style={{ touchAction: 'pan-y' }}>
            {initialData.map((manga) => {
              const mangaProgress = allBookmarks[manga.title];
              let targetHref = `/manga/${encodeURIComponent(manga.title)}`;
              
              if (mangaProgress) {
                const chapters = Object.keys(mangaProgress);
                const lastChapter = chapters[chapters.length - 1];
                if (lastChapter) targetHref = `/manga/${encodeURIComponent(manga.title)}/${encodeURIComponent(lastChapter)}`;
              }

              return (
                <Link key={manga.title} href={targetHref} className="w-32 sm:w-44 flex-shrink-0 group snap-start">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 mb-3 relative transition-transform group-hover:-translate-y-2">
                    <img 
                      src={manga.image || manga.cover} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={manga.title}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  </div>
                  <p className="text-[11px] font-black uppercase truncate text-zinc-400 group-hover:text-white">{manga.title}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. RESULTADOS (Lista para Búsqueda/Historial, Grilla para Home/Biblioteca) */}
      <div className="mt-2" style={{ touchAction: 'pan-y' }}>
        {view === "search" || view === "history" ? (
          
          /* --- MODO LISTA --- */
          <div className="flex flex-col divide-y divide-white/5 px-4 max-w-4xl mx-auto">
            {filteredMangas.map((manga, index) => (
              <Link 
                key={`${manga.title}-${index}`} 
                href={`/manga/${encodeURIComponent(manga.title)}`}
                className="py-5 flex items-center justify-between group active:bg-zinc-900/50 px-4 rounded-xl transition-colors"
                style={{ touchAction: 'pan-y' }}
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
            
            {filteredMangas.length === 0 && (
              <p className="text-center text-zinc-600 text-[10px] font-black uppercase mt-20 tracking-widest opacity-50 italic">
                {searchTerm ? "Sin coincidencias" : "No hay nada aquí todavía"}
              </p>
            )}
          </div>
        ) : (
          /* --- MODO GRILLA --- */
          <MangaGrid initialData={filteredMangas} />
        )}
      </div>
    </div>
  );
}