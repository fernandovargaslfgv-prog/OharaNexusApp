"use client";

import React from "react";
import Link from "next/link";

interface Manga {
  id?: number;
  title: string;
  path: string; // El nombre de la carpeta para la URL
  author: string;
  image: string; // URL de AniList o API Local
  latestChapter: string | number;
}

export default function MangaGrid({ initialData }: { initialData: Manga[] }) {
  return (
    <div className="bg-black text-white pb-20">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-8">
        <div 
          className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-10"
          style={{ touchAction: 'pan-y' }}
        >
          {initialData?.map((manga, index) => {
            // --- NORMALIZACIÓN DE DATOS ---
            // Usamos el título oficial y la imagen que ya viene procesada de page.tsx
            const title = manga.title || "Sin título";
            const author = manga.author || "Nexus Library";
            const image = manga.image;
            
            // Limpiamos la extensión si el capítulo viene con .cbz o .zip
            const rawChapter = manga.latestChapter || '0';
            const cleanChapter = String(rawChapter).replace(/\.(cbz|zip)$/i, "") || 'S/N';
            
            // Optimizamos la carga: los 6 primeros cargan de inmediato
            const isPriority = index < 6;

            return (
              <div key={`${manga.id || title}-${index}`} className="group flex flex-col gap-2">
                <Link
                  // IMPORTANTE: Usamos el PATH para la URL, así el sistema de archivos no se rompe
                  href={`/manga/${encodeURIComponent(manga.path || title)}`}
                  className="relative block w-full aspect-[2/3] shadow-2xl rounded-xl overflow-hidden border border-white/5 bg-zinc-900 transition-all duration-500 active:scale-95 group-hover:border-red-600/30"
                >
                  {/* IMAGEN DE PORTADA (AniList Priority) */}
                  <img 
                    src={image} 
                    alt={title} 
                    loading={isPriority ? "eager" : "lazy"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />

                  {/* BADGE DE CAPÍTULO (Estilo Manga Plus) */}
                  <div className="absolute top-0 left-0 bg-red-600 text-[8px] sm:text-[10px] font-black px-2 py-1 uppercase rounded-br-lg shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 italic">
                    {cleanChapter === "Serie" ? "Serie" : `Cap ${cleanChapter}`}
                  </div>

                  {/* OVERLAY DE METADATOS (Gradiente Premium) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 z-0" />
                  
                  <div className="absolute bottom-0 w-full p-2 sm:p-3 pt-10 z-10">
                    <p className="text-[7px] sm:text-[9px] text-red-500 font-black uppercase tracking-[0.2em] leading-none mb-1 drop-shadow-md italic">
                      {author}
                    </p>
                    <h3 className="text-[9px] sm:text-[13px] font-black text-white leading-tight line-clamp-2 uppercase italic drop-shadow-md tracking-tighter">
                      {title}
                    </h3>
                  </div>
                </Link>

                {/* PIE DE TARJETA (Nexus Branding) */}
                <div className="flex justify-between items-center px-1 opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-[7px] font-mono text-zinc-500">#{String(index + 1).padStart(3, '0')}</span>
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter italic">Nexus Hub</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}