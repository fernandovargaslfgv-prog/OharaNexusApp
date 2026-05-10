"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import SearchableHome from "@/components/SearchableHome";
import HeroBanner from "@/components/HeroBanner";
import BottomNav from "@/components/BottomNav";

interface Manga {
  title: string;
  author: string;
  image: string; 
  latestChapter: string | number;
}

export default function Home() {
  const [mangaData, setMangaData] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home"); 

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/manga");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        const formattedData: Manga[] = Array.isArray(data) ? data.map((m: any) => ({
          title: m.title || "Sin título",
          author: m.author || "Nexus Library",
          image: m.image || m.cover || "/placeholder-manga.jpg",
          latestChapter: m.latestChapter || "Cap. 1"
        })) : [];

        setMangaData(formattedData);
      } catch (err: any) {
        setMangaData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, []);

  const libraryData = useMemo(() => {
    if (typeof window === "undefined" || !Array.isArray(mangaData)) return [];
    try {
      const rawFavs = localStorage.getItem("manga-favorites");
      if (!rawFavs) return [];
      const favsArray = JSON.parse(rawFavs);
      if (!Array.isArray(favsArray)) return [];
      
      const favTitles = new Set(favsArray.map((m: any) => m?.title?.toLowerCase().trim()).filter(Boolean));
      return mangaData.filter(m => favTitles.has(m.title.toLowerCase().trim()));
    } catch (e) { return []; }
  }, [mangaData]);

  const historyData = useMemo(() => {
    if (typeof window === "undefined" || !Array.isArray(mangaData)) return [];
    try {
      const history = localStorage.getItem("nexus-history");
      if (!history) return [];
      const parsedHistory = JSON.parse(history);
      if (!Array.isArray(parsedHistory)) return [];
      
      const results: Manga[] = [];
      
      parsedHistory.forEach((item: any) => {
        if (!item?.title) return;
        const fullInfo = mangaData.find(m => 
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );
        
        results.push({
          title: item.title,
          image: fullInfo?.image || item.image || "/placeholder-manga.jpg",
          author: fullInfo?.author || "Nexus Library",
          latestChapter: fullInfo?.latestChapter || "Cap. Reciente"
        });
      });
      
      return results;
    } catch (e) { return []; }
  }, [mangaData]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-black uppercase">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] tracking-widest animate-pulse">Cargando Nexus...</span>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black pb-32 md:pb-10 overflow-y-auto">
      <Navbar /> 
      
      <div className="pt-[calc(env(safe-area-inset-top,0px)+45px)] animate-in fade-in duration-700">
        
        {currentView === "home" && (
          <div className="flex flex-col">
            <HeroBanner />
            <div className="px-4 md:px-8 mt-8">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest border-l-2 border-red-600 pl-3">
                Novedades Recientes
              </h3>
              <SearchableHome initialData={mangaData} showSearch={false} view="home" />
            </div>
          </div>
        )}

        {currentView === "search" && (
          <div className="px-4">
            <h2 className="text-xl font-black italic uppercase text-white mb-6 tracking-tighter">Explorar Nexus</h2>
            <SearchableHome initialData={mangaData} showSearch={true} view="search" />
          </div>
        )}

        {currentView === "library" && (
          <div className="px-4">
             <h2 className="text-xl font-black italic uppercase text-red-600 mb-6 tracking-tighter">Mi Biblioteca</h2>
             <SearchableHome initialData={libraryData} showSearch={true} view="library" />
             {libraryData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic">Tu biblioteca está vacía.</p>
             )}
          </div>
        )}

        {currentView === "history" && (
          <div className="px-4">
             <h2 className="text-xl font-black italic uppercase text-zinc-400 mb-6 tracking-tighter">Historial</h2>
             <SearchableHome initialData={historyData} showSearch={false} view="history" />
             {historyData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic">No has leído nada todavía.</p>
             )}
          </div>
        )}
      </div>

      <div className="md:hidden">
        <BottomNav currentView={currentView} setView={setCurrentView} />
      </div>
    </main>
  );
}