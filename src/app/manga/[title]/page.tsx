"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Chapter {
  name: string;
}

interface MangaDetails {
  title: string;
  chapters: Chapter[];
  image?: string;
}

export default function MangaPage({ params }: { params: Promise<{ title: string }> }) {
  // Desenvolvemos los params (necesario en versiones nuevas de Next.js)
  const resolvedParams = use(params);
  const decodedTitle = decodeURIComponent(resolvedParams.title);
  
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        // Llamamos a tu API de capítulos pasando el título
        const response = await fetch(`/api/chapters?title=${encodeURIComponent(decodedTitle)}`);
        if (!response.ok) throw new Error("No se encontraron capítulos");
        const data = await response.json();
        
        setManga({
          title: decodedTitle,
          chapters: Array.isArray(data) ? data : [],
          image: data[0]?.cover // Opcional: si tu API devuelve la portada
        });
      } catch (err) {
        console.error(err);
        setManga({ title: decodedTitle, chapters: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [decodedTitle]);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center italic font-black">
       <span className="text-[10px] tracking-widest animate-pulse uppercase">Buscando Capítulos...</span>
    </main>
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-[calc(env(safe-area-inset-top,0px)+60px)] px-4">
        {/* CABECERA */}
        <div className="mb-8">
          <Link href="/" className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">← Volver</Link>
          <h1 className="text-2xl font-black italic uppercase leading-none tracking-tighter">{decodedTitle}</h1>
          <p className="text-[10px] font-bold text-red-600 uppercase mt-1 tracking-widest">
            {manga?.chapters.length || 0} Capítulos disponibles
          </p>
        </div>

        {/* LISTA DE CAPÍTULOS */}
        <div className="flex flex-col gap-2 pb-20">
          {manga?.chapters.map((cap, index) => (
            <Link 
              key={index}
              href={`/reader/${encodeURIComponent(decodedTitle)}/${encodeURIComponent(cap.name)}`}
              className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex justify-between items-center active:scale-[0.98] transition-transform"
            >
              <span className="text-xs font-black uppercase tracking-tight">{cap.name}</span>
              <span className="text-[10px] font-black text-zinc-600">LEER →</span>
            </Link>
          ))}
          
          {manga?.chapters.length === 0 && (
            <div className="text-center py-20 text-zinc-700 text-[10px] font-black uppercase">
              No se han encontrado capítulos en la carpeta.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}