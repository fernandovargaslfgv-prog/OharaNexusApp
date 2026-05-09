"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HeroBanner() {
  const [latest, setLatest] = useState<{ title: string; chapter: string; image: string } | null>(null);

  useEffect(() => {
    // Recuperamos los datos que guardó el MangaReader
    const title = localStorage.getItem("nexus-latest-title");
    const chapter = localStorage.getItem("nexus-latest-chapter");
    const image = localStorage.getItem("nexus-latest-image");
    
    if (title && chapter && image) {
      setLatest({ title, chapter, image });
    }
  }, []);

  // Si no hay historial, el banner no ocupa espacio
  if (!latest) return null;

  return (
    <div className="px-4 mt-6 mb-8">
      <Link href={`/manga/${encodeURIComponent(latest.title)}`}>
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 group active:scale-[0.97] transition-all duration-300 shadow-2xl">
          
          {/* 1. IMAGEN DE FONDO: Con efecto de zoom suave al hacer hover */}
          <img 
            src={latest.image} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 transition-transform duration-1000 ease-out group-hover:scale-110"
          />
          
          {/* 2. DEGRADADO CINEMATOGRÁFICO: De izquierda (oscuro) a derecha (transparente) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
          
          {/* 3. CONTENIDO TEXTUAL */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-10">
            {/* Etiqueta roja estilo MangaPlus */}
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-red-600 mb-2 drop-shadow-md">
              Continuar Leyendo
            </span>
            
            {/* Título del Manga: Grande, itálico y con límite de líneas */}
            <h2 className="text-xl sm:text-3xl font-black uppercase italic leading-none truncate max-w-[85%] text-white drop-shadow-xl">
              {latest.title}
            </h2>
            
            {/* Número del Capítulo */}
            <p className="text-[10px] sm:text-xs text-zinc-300 font-bold uppercase mt-2 tracking-widest drop-shadow-md">
              Capítulo {latest.chapter}
            </p>
          </div>

          {/* 4. EFECTO DE LUZ AL TOCAR (APK/Móvil) */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity z-30" />
        </div>
      </Link>
    </div>
  );
}