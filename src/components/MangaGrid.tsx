"use client";

import React from "react";
import Link from "next/link";

interface Manga {
  title: string;
  author: string;
  autor?: string; 
  image: string;
  cover?: string; 
  latestChapter: string | number;
  chapter?: string | number; 
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
            // --- 🕵️‍♂️ BLOQUE DE DIAGNÓSTICO (Se mantiene para verificar datos) ---
            if (index === 0) {
              console.log("DATOS EN GRID:", manga);
            }

            // --- NORMALIZACIÓN DE DATOS (Mantenemos tu lógica de blindaje) ---
            const title = manga.title || "Sin título";
            const author = manga.author || manga.autor || "Nexus Library";
            const image = manga.image || manga.cover || "";
            const rawChapter = manga.latestChapter || manga.chapter || '0';
            const cleanChapter = String(rawChapter).replace(/\.(cbz|zip)$/i, "") || 'S/N';
            
            const isPriority = index < 6;

            return (
              <div key={`${title}-${index}`} className="group flex flex-col gap-2">
                <Link
                  href={`/manga/${encodeURIComponent(title)}`}
                  className="relative block w-full aspect-[2/3] shadow-2xl rounded-xl overflow-hidden border border-white/5 bg-zinc-900 transition-all duration-300 active:scale-95"
                >
                  {/* IMAGEN DE PORTADA CON EFECTO ZOOM AL HOVER */}
                  <img 
                    src={image} 
                    alt={title} 
                    loading={isPriority ? "eager" : "lazy"} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />

                  {/* BADGE DE CAPÍTULO (Arriba a la izquierda - Siempre visible) */}
                  <div className="absolute top-0 left-0 bg-red-600 text-[8px] sm:text-[10px] font-black px-2 py-1 uppercase rounded-br-lg shadow-lg z-20">
                    Cap {cleanChapter}
                  </div>

                  {/* OVERLAY DE METADATOS (Siempre visible con degradado) */}
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-2 sm:p-3 pt-8 z-10">
                    <p className="text-[7px] sm:text-[9px] text-red-500 font-black uppercase tracking-widest leading-none mb-1 drop-shadow-md">
                      {author}
                    </p>
                    <h3 className="text-[9px] sm:text-[13px] font-black text-white leading-tight line-clamp-2 uppercase italic drop-shadow-md">
                      {title}
                    </h3>
                  </div>
                </Link>

                {/* PIE DE TARJETA (Identificador único) */}
                <div className="flex justify-between items-center px-1 opacity-50">
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