"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface MangaReaderProps {
  images: string[]; 
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
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. CARGA INICIAL Y PREFERENCIAS
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

  // 2. SINCRONIZACIÓN DE POSICIÓN (Al cambiar modo o carga inicial)
  useEffect(() => {
    if (isLoaded && containerRef.current) {
      const container = containerRef.current;
      if (readMode === "horizontal") {
        container.scrollTo({ left: currentPage * container.clientWidth, behavior: 'instant' });
      } else {
        const children = Array.from(container.children) as HTMLElement[];
        const targetImg = children[currentPage];
        if (targetImg) {
          container.scrollTo({ top: targetImg.offsetTop - 80, behavior: 'instant' });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readMode, isLoaded]); 

  // 3. GUARDADO DE PROGRESO (LocalStorage + Servidor SQLite)
  useEffect(() => {
    if (!isLoaded || !images || images.length === 0) return;
    const titleKey = title.trim();
    const safeChapter = chapter.trim();
    
    // A) LocalStorage (Para redundancia)
    localStorage.setItem(`nexus-page-${titleKey.toLowerCase()}-${safeChapter}`, currentPage.toString());
    localStorage.setItem(`nexus-last-${titleKey.toLowerCase()}`, safeChapter);

    // B) Sincronización con el Servidor (Para que aparezca en la Home)
    const syncHistory = async () => {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleKey,
            chapter: safeChapter,
            page: currentPage
          })
        });
      } catch (err) {
        console.error("Error sincronizando historial:", err);
      }
    };

    const timer = setTimeout(syncHistory, 800); // Debounce para no saturar la DB
    return () => clearTimeout(timer);
  }, [currentPage, isLoaded, title, chapter]);

  // 4. DETECTOR DE PÁGINA SEGÚN EL SCROLL
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isZoomed) return;
    const target = e.currentTarget;
    let index = 0;

    if (readMode === "horizontal") {
      index = Math.round(target.scrollLeft / target.clientWidth);
    } else {
      const children = Array.from(target.children) as HTMLElement[];
      const scrollTop = target.scrollTop + 150;
      index = children.findIndex(child => child.offsetTop + child.clientHeight > scrollTop);
    }

    if (index !== currentPage && index >= 0 && index < images.length) {
      setCurrentPage(index);
    }
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  if (!images || images.length === 0) return <div className="h-screen bg-black" />;

  return (
    <main className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden select-none">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+1.2rem)] pb-3 transition-transform duration-300 ${isZoomed ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href={`/manga/${encodeURIComponent(title)}`} className="text-[10px] font-black uppercase text-zinc-400 py-2">← Volver</Link>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black uppercase text-red-600 italic tracking-tighter truncate max-w-[150px]">{title}</span>
          <span className="text-white font-black text-xs bg-zinc-900 px-2 py-0.5 rounded">{currentPage + 1} / {images.length}</span>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-zinc-400 text-lg">⚙️</button>
      </nav>

      {/* ÁREA DE LECTURA */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full flex-1 bg-black pt-[calc(4rem+env(safe-area-inset-top,0px))]
          ${readMode === "horizontal" ? "block overflow-x-auto whitespace-nowrap snap-x snap-mandatory" : "flex flex-col overflow-y-auto"}
          ${isZoomed ? "!overflow-hidden" : ""} 
          hide-scrollbar
        `}
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={() => setShowSettings(false)}
      >
        {images.map((src, i) => (
          <div key={i} 
               className={`
                ${readMode === "horizontal" ? "inline-block w-screen h-full snap-center align-top" : "block w-full h-auto flex-shrink-0 mb-1"} 
                relative overflow-hidden
               `}
               onDoubleClick={toggleZoom}
          >
            <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ease-in-out
                            ${isZoomed && i === currentPage ? "scale-[2.5] z-50" : "scale-100"}`}
            >
              <img 
                src={src} 
                alt={`Página ${i+1}`} 
                className={`${readMode === "horizontal" ? "max-w-full max-h-full" : "w-full h-auto"} object-contain pointer-events-none`} 
                loading={i < 3 ? "eager" : "lazy"}
              />
            </div>
          </div>
        ))}
      </div>

      {/* PROGRESO INFERIOR */}
      <div className={`h-1 bg-zinc-900 w-full fixed bottom-0 z-50 transition-transform duration-300 ${isZoomed ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-300" style={{ width: `${((currentPage + 1) / images.length) * 100}%` }} />
      </div>

      {/* AJUSTES */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-64 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => {setReadMode("horizontal"); localStorage.setItem("nexus-read-mode", "horizontal"); setShowSettings(false)}} className={`w-full px-6 py-4 text-[10px] font-black uppercase text-left ${readMode === "horizontal" ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>↔️ Horizontal</button>
                <button onClick={() => {setReadMode("vertical"); localStorage.setItem("nexus-read-mode", "vertical"); setShowSettings(false)}} className={`w-full px-6 py-4 text-[10px] font-black uppercase text-left ${readMode === "vertical" ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>↕️ Vertical</button>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </main>
  );
}