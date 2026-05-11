"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchableHome from "@/components/SearchableHome";
import HeroBanner from "@/components/HeroBanner";
import BottomNav from "@/components/BottomNav";

interface Manga {
  id: number;
  title: string;
  path: string; // Crucial: nombre de la carpeta física
  author: string;
  image: string; 
  latestChapter: string | number;
}

export default function Home() {
  const [mangaData, setMangaData] = useState<Manga[]>([]);
  const [libraryData, setLibraryData] = useState<Manga[]>([]);
  const [historyData, setHistoryData] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home"); 

  // 1. CARGA DESDE LA BASE DE DATOS (A través de tu API)
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        // Esta API ahora debe devolver los datos de la tabla 'mangas' de SQLite
        const response = await fetch("/api/manga");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        const formattedData: Manga[] = Array.isArray(data) ? data.map((m: any) => ({
          id: m.id,
          title: m.title || "Sin título",
          path: m.path, // Guardamos el nombre de la carpeta
          author: m.author || "Nexus Library",
          // USAMOS EL PATH: Así la portada siempre carga aunque el título cambie
          image: `/api/cover?series=${encodeURIComponent(m.path)}`,
          latestChapter: m.latestChapter || "Cap. Reciente"
        })) : [];

        setMangaData(formattedData);
      } catch (err) {
        console.error("Error cargando mangas:", err);
        setMangaData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, []);

  // 2. CARGA DE FAVORITOS (Usando PATH para comparar)
  useEffect(() => {
    if (currentView === "library" && mangaData.length > 0) {
      fetch("/api/favorites")
        .then(res => res.json())
        .then(favs => {
          if (!Array.isArray(favs)) return setLibraryData([]);
          
          // Filtramos comparando por el PATH o ID, que son únicos
          const filtered = mangaData.filter(m => 
            favs.some((f: any) => 
              (typeof f === 'string' && f === m.path) || 
              (f.mangaId === m.id)
            )
          );
          setLibraryData(filtered);
        })
        .catch(() => setLibraryData([]));
    }
  }, [currentView, mangaData]);

  // 3. CARGA DE HISTORIAL
  useEffect(() => {
    if (currentView === "history" && mangaData.length > 0) {
      fetch("/api/history") 
        .then(res => res.json())
        .then(historyItems => {
          if (!Array.isArray(historyItems)) return setHistoryData([]);

          const results: Manga[] = [];
          historyItems.forEach((item: any) => {
            const fullInfo = mangaData.find(m => m.id === item.mangaId || m.path === item.mangaPath);
            
            if (fullInfo) {
              results.push({
                ...fullInfo,
                latestChapter: item.lastChapter || "Cap. 1"
              });
            }
          });
          setHistoryData(results);
        })
        .catch(() => setHistoryData([]));
    }
  }, [currentView, mangaData]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-black uppercase">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] tracking-widest animate-pulse font-bold">Iniciando Nexus...</span>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black pb-32 md:pb-10 overflow-y-auto">
      <Navbar /> 
      
      <div className="pt-[calc(env(safe-area-inset-top,0px)+45px)]">
        
        {currentView === "home" && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HeroBanner />
            <div className="px-4 md:px-8 mt-8">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest border-l-2 border-red-600 pl-3">
                Novedades de la Biblioteca
              </h3>
              {/* Le pasamos mangaData y usamos el 'path' para los links internos */}
              <SearchableHome initialData={mangaData} showSearch={false} view="home" />
            </div>
          </div>
        )}

        {currentView === "search" && (
          <div className="px-4 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black italic uppercase text-white mb-6 tracking-tighter">Explorar Catálogo</h2>
            <SearchableHome initialData={mangaData} showSearch={true} view="search" />
          </div>
        )}

        {currentView === "library" && (
          <div className="px-4 animate-in fade-in duration-500">
             <h2 className="text-xl font-black italic uppercase text-red-600 mb-6 tracking-tighter">Mi Estantería</h2>
             <SearchableHome initialData={libraryData} showSearch={true} view="library" />
             {libraryData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic tracking-widest">No tienes mangas guardados.</p>
             )}
          </div>
        )}

        {currentView === "history" && (
          <div className="px-4 animate-in fade-in duration-500">
             <h2 className="text-xl font-black italic uppercase text-zinc-400 mb-6 tracking-tighter">Continuar Leyendo</h2>
             <SearchableHome initialData={historyData} showSearch={false} view="history" />
             {historyData.length === 0 && (
               <p className="text-zinc-600 text-[10px] uppercase font-bold text-center mt-20 opacity-50 italic tracking-widest">Aún no has empezado ninguna obra.</p>
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