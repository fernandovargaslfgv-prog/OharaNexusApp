"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchableHome from "@/components/SearchableHome";
import BottomNav from "@/components/BottomNav";

interface Manga {
  id: number;
  title: string;
  path: string; 
  author: string;
  image: string; // Portada (Prioridad: AniList > Local)
  banner?: string;
  latestChapter: string | number;
}

export default function Home() {
  const [mangaData, setMangaData] = useState<Manga[]>([]);
  const [libraryData, setLibraryData] = useState<Manga[]>([]);
  const [historyData, setHistoryData] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  
  type ViewType = "home" | "search" | "library" | "history";
  const [currentView, setCurrentView] = useState<ViewType>("home"); 

  // 1. CARGA DESDE LA BASE DE DATOS (Con el nuevo mapeo de metadatos)
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/manga");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        // Mapeamos los datos asegurándonos de usar las columnas de AniList
        const formattedData: Manga[] = Array.isArray(data) ? data.map((m: any) => {
          const localCover = `/api/cover?series=${encodeURIComponent(m.path)}`;
          
          return {
            id: m.id,
            // Usamos el título oficial de AniList que ahora devuelve la API
            title: m.title || m.path || "Sin título",
            path: m.path,
            author: m.author || "Nexus Library",
            // PRIORIDAD VISUAL: Si el JSON trae 'coverImage' o 'image' de AniList, la usamos
            image: m.coverImage || m.image || localCover,
            banner: m.bannerImage || m.banner || null,
            latestChapter: m.latestChapter || "Serie"
          };
        }) : [];

        setMangaData(formattedData);
      } catch (err) {
        console.error("❌ Error cargando catálogo en Home:", err);
        setMangaData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, []);

  // 2. CARGA DE FAVORITOS (Reflejando la calidad visual)
  useEffect(() => {
    if (currentView === "library" && mangaData.length > 0) {
      fetch("/api/favorites")
        .then(res => res.json())
        .then(favs => {
          if (!Array.isArray(favs)) return setLibraryData([]);
          // Filtramos sobre mangaData para mantener los metadatos de AniList
          const filtered = mangaData.filter(m => 
            favs.some((f: any) => (f.mangaId === m.id || f === m.path))
          );
          setLibraryData(filtered);
        })
        .catch(() => setLibraryData([]));
    }
  }, [currentView, mangaData]);

  // 3. CARGA DE HISTORIAL (Con cruce de metadatos oficial)
  useEffect(() => {
    if (currentView === "history" && mangaData.length > 0) {
      fetch("/api/history") 
        .then(res => res.json())
        .then(historyItems => {
          if (!Array.isArray(historyItems)) return setHistoryData([]);
          const results: Manga[] = [];
          historyItems.forEach((item: any) => {
            const fullInfo = mangaData.find(m => 
              m.id === item.mangaId || m.path === item.mangaPath || m.path === item.path
            );
            if (fullInfo) {
              results.push({
                ...fullInfo,
                latestChapter: item.chapter || "Cap. 1"
              });
            }
          });
          setHistoryData(results);
        })
        .catch(() => setHistoryData([]));
    }
  }, [currentView, mangaData]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(220,38,38,0.4)]" />
        <span className="text-[10px] tracking-[0.4em] animate-pulse font-black uppercase italic text-red-600">Sincronizando Nexus...</span>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black pb-32 md:pb-10 overflow-y-auto scroll-smooth no-scrollbar">
      <Navbar /> 
      
      <div className="pt-[calc(env(safe-area-inset-top,0px)+45px)]">
        
        {/* VISTA HOME: El HeroBanner ahora podrá usar banners de AniList */}
        {currentView === "home" && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <SearchableHome initialData={mangaData} showSearch={false} view="home" />
            
            <div className="px-4 md:px-8 mt-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">
                  Catálogo de la Biblioteca
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* VISTA BÚSQUEDA */}
        {currentView === "search" && (
          <div className="px-4 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black italic uppercase text-white mb-6 tracking-tighter border-l-4 border-red-600 pl-4">Explorar Catálogo</h2>
            <SearchableHome initialData={mangaData} showSearch={true} view="search" />
          </div>
        )}

        {/* VISTA BIBLIOTECA (FAVORITOS) */}
        {currentView === "library" && (
          <div className="px-4 animate-in fade-in duration-500">
             <h2 className="text-xl font-black italic uppercase text-red-600 mb-6 tracking-tighter border-l-4 border-zinc-800 pl-4">Mi Colección</h2>
             <SearchableHome initialData={libraryData} showSearch={true} view="library" />
          </div>
        )}

        {/* VISTA HISTORIAL (RECIENTES) */}
        {currentView === "history" && (
          <div className="px-4 animate-in fade-in duration-500">
             <h2 className="text-xl font-black italic uppercase text-zinc-400 mb-6 tracking-tighter border-l-4 border-white/10 pl-4">Visto Recientemente</h2>
             <SearchableHome initialData={historyData} showSearch={false} view="history" />
          </div>
        )}
      </div>

      {/* Navegación móvil con FIX DE TIPOS */}
      <div className="md:hidden">
        <BottomNav 
          currentView={currentView} 
          setView={(view: string) => setCurrentView(view as ViewType)} 
        />
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}