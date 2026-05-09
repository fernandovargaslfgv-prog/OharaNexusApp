"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import SearchableHome from "@/components/SearchableHome";
import HeroBanner from "@/components/HeroBanner";
import BottomNav from "@/components/BottomNav";

// Interfaz actualizada para coincidir con la nueva API de Base de Datos
interface Manga {
  title: string;
  author: string;
  image: string; // Aquí vendrá el Base64 o la URL de la API de covers
  latestChapter: string | number;
}

export default function Home() {
  const [mangaData, setMangaData] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home"); 

  // Cargamos los datos de la DB al iniciar
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/manga");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setMangaData(data);
      } catch (err) {
        console.error("Error al cargar mangas desde la DB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, []);

  // --- 🛠️ BIBLIOTECA (Re-hidratada desde DB) ---
  const libraryData = useMemo(() => {
    if (typeof window === "undefined" || mangaData.length === 0) return [];
    
    try {
      const rawFavs = localStorage.getItem("manga-favorites");
      if (!rawFavs) return [];

      const favsArray = JSON.parse(rawFavs);
      const favTitles = new Set(favsArray.map((m: any) => m.title?.toLowerCase().trim()));

      // Filtramos la data maestra de la DB
      return mangaData.filter(m => favTitles.has(m.title.toLowerCase().trim()));
    } catch (e) {
      return [];
    }
  }, [mangaData]);

  // --- 🛠️ HISTORIAL (Re-hidratado desde DB) ---
  const historyData = useMemo(() => {
    if (typeof window === "undefined" || mangaData.length === 0) return [];
    try {
      const history = localStorage.getItem("nexus-history");
      if (!history) return [];
      
      const parsedHistory = JSON.parse(history);
      
      return parsedHistory.map((item: any) => {
        // Buscamos la info real en nuestra nueva DB
        const fullInfo = mangaData.find(m => 
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );

        return {
          title: item.title,
          // Prioridad: Portada de la DB > Portada guardada > Placeholder
          image: fullInfo?.image || item.image || item.cover || "/placeholder-manga.jpg",
          author: fullInfo?.author || "Nexus Library",
          latestChapter: fullInfo?.latestChapter || "Cap. Reciente",
          chapter: item.chapter // El capítulo específico que el usuario estaba leyendo
        };
      });
    } catch (e) {
      return [];
    }
  }, [mangaData]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center italic font-black uppercase">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] tracking-[0.3em] animate-pulse">Cargando Nexus DB...</span>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black pb-32 md:pb-10 overflow-y-auto">
      <Navbar /> 

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- VISTA INICIO --- */}
        {currentView === "home" && (
          <div className="flex flex-col">
            <HeroBanner />
            <div className="px-4 md:px-8">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-[0.2em] border-l-2 border-red-600 pl-3">
                Novedades Recientes
              </h3>
              <SearchableHome initialData={mangaData} showSearch={false} view="home" />
            </div>
          </div>
        )}

        {/* --- VISTA BÚSQUEDA --- */}
        {currentView === "search" && (
          <div className="px-4 pt-4">
            <h2 className="text-xl font-black italic uppercase text-white mb-6 tracking-tighter">Explorar Nexus</h2>
            <SearchableHome initialData={mangaData} showSearch={true} view="search" />
          </div>
        )}

        {/* --- VISTA BIBLIOTECA --- */}
        {currentView === "library" && (
          <div className="px-4 pt-4">
             <h2 className="text-xl font-black italic uppercase text-red-600 mb-6 tracking-tighter">Mi Biblioteca</h2>
             <SearchableHome initialData={libraryData} showSearch={true} view="library" />
             {libraryData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic">
                 Tu biblioteca está vacía. Añade favoritos desde la ficha del manga.
               </p>
             )}
          </div>
        )}

        {/* --- VISTA HISTORIAL --- */}
        {currentView === "history" && (
          <div className="px-4 pt-4">
             <h2 className="text-xl font-black italic uppercase text-zinc-400 mb-6 tracking-tighter">Historial de Lectura</h2>
             <SearchableHome initialData={historyData} showSearch={false} view="history" />
             {historyData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic">
                 No has leído nada todavía.
               </p>
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