"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MangaReaderProps {
  images: string[];
  title: string;
  chapter: string;
  coverImage: string;
}

export default function MangaReader({ images, title, chapter, coverImage }: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- CARGAR PROGRESO ---
  useEffect(() => {
    const safeTitle = title.trim().toLowerCase();
    const safeChapter = chapter.trim();
    const savedPage = localStorage.getItem(`nexus-page-${safeTitle}-${safeChapter}`);
    
    if (savedPage) {
      const parsedPage = parseInt(savedPage, 10);
      if (!isNaN(parsedPage) && parsedPage < images.length) {
        setCurrentPage(parsedPage);
      }
    }
    setIsLoaded(true);
  }, [title, chapter, images.length]);

  // --- GUARDAR HISTORIAL Y PROGRESO ---
  useEffect(() => {
    if (!isLoaded) return;
    
    const safeTitle = title.trim();
    const safeChapter = chapter.trim();
    const storageKeyTitle = safeTitle.toLowerCase();
    
    localStorage.setItem(`nexus-last-${storageKeyTitle}`, safeChapter);
    localStorage.setItem(`nexus-page-${storageKeyTitle}-${safeChapter}`, currentPage.toString());
    localStorage.setItem("nexus-latest-title", safeTitle); 
    localStorage.setItem("nexus-latest-chapter", safeChapter);
    localStorage.setItem("nexus-latest-image", coverImage);
    
    try {
      const rawHistory = localStorage.getItem("nexus-history");
      let history = rawHistory ? JSON.parse(rawHistory) : [];
      const historyItem = {
        title: safeTitle,
        chapter: safeChapter,
        image: coverImage,
        timestamp: Date.now()
      };
      // Filtro para no duplicar mangas en el historial
      const filteredHistory = history.filter((item: any) => item.title.toLowerCase() !== safeTitle.toLowerCase());
      const newHistory = [historyItem, ...filteredHistory].slice(0, 20);
      localStorage.setItem("nexus-history", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error historial:", error);
    }
  }, [title, chapter, currentPage, isLoaded, coverImage]);

  const nextPage = () => { 
    if (currentPage < images.length - 1) {
      setCurrentPage(c => c + 1);
      window.scrollTo(0, 0); 
    }
  };
  
  const prevPage = () => { 
    if (currentPage > 0) {
      setCurrentPage(c => c - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col overflow-hidden select-none">
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-white/5">
        <Link href={`/manga/${encodeURIComponent(title)}`} className="text-[10px] font-black uppercase text-zinc-400 hover:text-red-600 transition-colors py-2">
          ← Volver
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black uppercase text-zinc-600 truncate max-w-[150px]">{title}</span>
          <div className="text-[10px] font-bold text-zinc-500 uppercase">
            <span className="text-white font-black text-xs bg-zinc-900 px-2 py-1 rounded">
              {currentPage + 1} / {images.length}
            </span>
          </div>
        </div>
        <div className="w-8"></div>
      </nav>

      {/* IMAGEN CENTRADA */}
      <div 
        className="flex-1 flex flex-col items-center justify-center cursor-pointer w-full pt-16 pb-10"
        onClick={(e) => {
          if (e.clientY < 80) return; 
          if (e.clientX > window.innerWidth / 2) nextPage();
          else prevPage();
        }}
      >
        <img 
          src={images[currentPage]} 
          alt="" 
          className="max-w-full h-auto max-h-[90vh] object-contain shadow-2xl pointer-events-none select-none" 
        />
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="fixed bottom-0 w-full h-1 bg-zinc-900 z-50">
        <div 
          className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
          style={{ width: `${((currentPage + 1) / images.length) * 100}%` }} 
        />
      </div>
    </main>
  );
}