"use client";

import Link from "next/link";

interface Manga {
  id?: number;
  title: string;
  author: string;
  image: string;    
  banner?: string;   
  path: string;
  description?: string;
  latestChapter?: string | number;
}

interface HeroBannerProps {
  featured: Manga | null;
  lastReadChapter?: string;
}

export default function HeroBanner({ featured, lastReadChapter }: HeroBannerProps) {
  if (!featured) return null;

  // Prioridad: Banner oficial > Fallback portada vertical
  const bannerImage = featured.banner || featured.image;
  const displayTitle = featured.title || "Nexus Library";

  return (
    <div className="px-4 md:px-8 mt-4 mb-6">
      <Link href={`/manga/${encodeURIComponent(featured.path)}`}>
        {/* CAMBIO: aspect-[16/9] para móvil y md:aspect-[25/9] para escritorio */}
        <div className="relative aspect-[16/9] md:aspect-[25/9] w-full overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/10 group active:scale-[0.97] transition-all duration-700 shadow-2xl">
          
          {/* IMAGEN DE FONDO */}
          <img 
            src={bannerImage} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-1000 group-hover:scale-105 opacity-70"
          />

          {/* GRADIENTES CAPA SOBRE CAPA (Para legibilidad extrema) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10" />
          
          {/* CONTENIDO */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-6 md:pb-10 px-6 md:px-12">
            
            {/* BADGE "CONTINUAR" */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 bg-red-600/20 backdrop-blur-md border border-red-600/40 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-red-500 italic">
                  {lastReadChapter ? "Continuar Leyendo" : "Destacado"}
                </span>
              </div>
            </div>

            {/* TÍTULO (Más grande y con sombra) */}
            <h2 className="text-2xl md:text-5xl lg:text-6xl font-black uppercase italic leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-tighter mb-2 md:mb-4">
              {displayTitle}
            </h2>

            {/* DESCRIPCIÓN (Solo aparece en tablets/PC) */}
            {featured.description && (
              <p className="hidden md:block text-zinc-300 text-sm max-w-xl line-clamp-2 mb-6 leading-relaxed font-medium opacity-80">
                {featured.description.replace(/<[^>]*>?/gm, '')}
              </p>
            )}

            {/* INFO DEL CAPÍTULO Y ACCIÓN */}
            <div className="flex items-center justify-between md:justify-start md:gap-6">
              {lastReadChapter && (
                <div className="flex flex-col">
                  <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Último Acceso</span>
                  <span className="text-[10px] md:text-xs text-white font-bold uppercase italic bg-white/5 border border-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    {lastReadChapter.replace(/\.[^/.]+$/, "")}
                  </span>
                </div>
              )}
              
              {/* BOTÓN "PLAY" */}
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-red-600 transition-all duration-300 shadow-xl self-end">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black group-hover:text-white transition-colors ml-1 md:w-6 md:h-6">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </Link>
    </div>
  );
}