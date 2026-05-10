"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface MangaPage {
  name?: string;
}

interface MangaReaderProps {
  images: (string | MangaPage)[]; 
  title: string;
  chapter: string;
  coverImage: string;
}

type ReadMode = "horizontal" | "vertical";

export default function MangaReader({ images, title, chapter, coverImage }: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [readMode, setReadMode] = useState<ReadMode>("horizontal");
  const [showSettings, setShowSettings] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false); // <--- Control de Zoom
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. CARGA DE PREFERENCIAS Y PROGRESO (Seguro para Build)
  useEffect(() => {
    if (!images || images.length === 0) return;
    const safeTitle = title.trim().toLowerCase();
    const safeChapter = chapter.trim();
    
    const savedPage = localStorage.getItem(`nexus-page-${safeTitle}-${safeChapter}`);
    if (savedPage) {
      const parsedPage = parseInt(savedPage, 10);
      if (!isNaN(parsedPage) && parsedPage < images.length) setCurrentPage(parsedPage);
    }

    const savedMode = localStorage.getItem("nexus-read-mode") as ReadMode;
    if (savedMode) setReadMode(savedMode);
    
    setIsLoaded(true);
  }, [title, chapter, images]);

  // 2. GUARDADO DE PROGRESO E HISTORIAL
  useEffect(() => {
    if (!isLoaded || !images || images.length === 0) return;
    const safeTitle = title.trim();
    const safeChapter = chapter.trim();
    const titleKey = safeTitle.toLowerCase();
    
    localStorage.setItem(`nexus-page-${titleKey}-${safeChapter}`, currentPage.toString());
    localStorage.setItem(`nexus-last-${titleKey}`, safeChapter);
    localStorage.setItem("nexus-latest-title", safeTitle); 
    localStorage.setItem("nexus-latest-chapter", safeChapter);
    localStorage.setItem("nexus-latest-image", coverImage);

    try {
      const rawHistory = localStorage.getItem("nexus-history");
      let history = rawHistory ? JSON.parse(rawHistory) : [];
      const historyItem = { title: safeTitle, chapter: safeChapter, image: coverImage, timestamp: Date.now() };
      const filteredHistory = history.filter((item: any) => item.title.toLowerCase() !== titleKey);
      localStorage.setItem("nexus-history", JSON.stringify([historyItem, ...filteredHistory].slice(0, 20)));
    } catch (e) {}
  }, [currentPage, isLoaded, title, chapter, coverImage, images]);

  // 3. SINCRONIZACIÓN AL CAMBIAR MODO
  useEffect(() => {
    if (isLoaded && containerRef.current) {
      const container = containerRef.current;
      if (readMode === "horizontal") {
        container.scrollTo({ left: currentPage * container.clientWidth, behavior: 'instant' });
      } else {
        const pageHeight = container.scrollHeight / (images.length || 1);
        container.scrollTo({ top: currentPage * pageHeight, behavior: 'instant' });
      }
    }
  }, [readMode, isLoaded]);

  // 4. DETECTOR DE PÁGINA ACTUAL
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isZoomed) return; // Bloquear cambio de página mientras hay zoom
    const target = e.currentTarget;
    let index = 0;
    if (readMode === "horizontal") {
      index = Math.round(target.scrollLeft / target.clientWidth);
    } else {
      const totalScrollable = target.scrollHeight - target.clientHeight;
      if (totalScrollable > 0) {
        index = Math.round((target.scrollTop / totalScrollable) * (images.length - 1));
      }
    }
    if (index !== currentPage && index >= 0 && index < images.length) {
      setCurrentPage(index);
    }
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  const changeMode = (mode: ReadMode) => {
    setReadMode(mode);
    localStorage.setItem("nexus-read-mode", mode);
    setShowSettings(false);
  };

  if (!images || images.length === 0) return <div className="h-screen bg-black" />;

  return (
    <main className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden select-none">
      
      {/* HEADER (Se oculta en zoom para inmersión) */}
      <nav className={`fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+2px)] pb-3 transition-transform duration-300 ${isZoomed ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href={`/manga/${encodeURIComponent(title)}`} className="text-[10px] font-black uppercase text-zinc-400 py-2 flex-1">← Volver</Link>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[8px] font-black uppercase text-zinc-600 truncate max-w-[120px]">{title}</span>
          <span className="text-white font-black text-xs bg-zinc-900 px-2 py-0.5 rounded">{currentPage + 1} / {images.length}</span>
        </div>
        <div className="flex-1 flex justify-end relative">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-zinc-400">⚙️</button>
          {showSettings && (
            <div className="absolute top-12 right-0 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl w-44 overflow-hidden z-[60]">
              <button onClick={() => changeMode("horizontal")} className={`w-full px-4 py-3 text-[10px] font-black uppercase text-left ${readMode === "horizontal" ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>↔️ Horizontal</button>
              <button onClick={() => changeMode("vertical")} className={`w-full px-4 py-3 text-[10px] font-black uppercase text-left ${readMode === "vertical" ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>↕️ Vertical</button>
            </div>
          )}
        </div>
      </nav>

      {/* ÁREA DE LECTURA */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full flex-1 bg-black pt-[calc(4rem+env(safe-area-inset-top,0px))]
          ${readMode === "horizontal" ? "block overflow-x-scroll whitespace-nowrap snap-x snap-mandatory" : "flex flex-col overflow-y-auto"}
          ${isZoomed ? "!overflow-hidden" : ""} 
          hide-scrollbar
        `}
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={() => setShowSettings(false)}
      >
        {images.map((img, i) => {
          const pageName = typeof img === 'string' ? img : img?.name;
          const src = `/api/page?title=${encodeURIComponent(title)}&chapter=${encodeURIComponent(chapter)}&pageName=${encodeURIComponent(pageName || "")}`;
          return (
            <div key={i} 
                 className={`${readMode === "horizontal" ? "inline-block w-screen h-full snap-center align-top" : "block w-full h-auto mb-1"} overflow-hidden`}
                 onDoubleClick={toggleZoom}
                 onTouchEnd={(e) => { if (e.detail === 2) toggleZoom(); }} // Doble toque en móvil
            >
              <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ease-in-out
                              ${isZoomed && i === currentPage ? "scale-[2.2] z-50 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
              >
                <img 
                  src={src} 
                  alt={`Página ${i+1}`} 
                  className={`${readMode === "horizontal" ? "max-w-full max-h-full" : "w-full h-auto"} object-contain pointer-events-none`} 
                  loading={Math.abs(i - currentPage) < 3 ? "eager" : "lazy"} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA DE PROGRESO */}
      <div className={`h-1 bg-zinc-900 w-full fixed bottom-0 z-50 transition-transform duration-300 ${isZoomed ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${((currentPage + 1) / images.length) * 100}%` }} />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}