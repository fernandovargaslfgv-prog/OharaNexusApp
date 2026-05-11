import fs from "fs";
import path from "path";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import LastReadBadge from "@/components/LastReadBadge";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq, or } from "drizzle-orm";

type MangaLobbyProps = {
  params: Promise<{ title: string }>;
};

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";

export default async function MangaLobbyPage({ params }: MangaLobbyProps) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  
  // Buscamos en la DB por path o por título oficial
  const mangaData = await db.query.mangas.findFirst({
    where: or(eq(mangas.path, decodedTitle), eq(mangas.title, decodedTitle)),
  });

  const actualFolderName = mangaData?.path || decodedTitle;
  const folderPath = path.join(MANGA_ROOT, actualFolderName);

  // Parseamos los géneros si existen (vienen como string JSON desde AniList)
  const genresArray = mangaData?.genres ? JSON.parse(mangaData.genres) : [];

  let chapters: string[] = [];
  if (fs.existsSync(folderPath)) {
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
    chapters = entries
      .filter(ent => !ent.name.startsWith('.') && (ent.isDirectory() || /\.(cbz|zip|cbr)$/i.test(path.extname(ent.name))))
      .map(ent => ent.name)
      // Orden natural para capítulos (1, 2, 10 en lugar de 1, 10, 2)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  }

  // Configuración de imágenes: Prioridad Metadatos > Local
  const localCover = `/api/cover?series=${encodeURIComponent(actualFolderName)}`;
  const mainPoster = mangaData?.coverImage || localCover;
  const bannerImg = mangaData?.bannerImage || localCover;

  return (
    <main className="min-h-screen bg-black text-white pb-24 font-sans">
      
      {/* --- SECCIÓN HEADER: EL BANNER ESPECTACULAR --- */}
      <section className="relative w-full pt-28 pb-20 overflow-hidden">
        {/* Fondo inmersivo con Banner */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImg} 
            className="w-full h-full object-cover opacity-30 blur-2xl scale-110" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-10 items-end">
          {/* Poster Principal con Sombra Pro */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img 
              src={mainPoster} 
              className="w-64 h-92 object-cover rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-white/10 transition-transform duration-700 hover:scale-[1.02]" 
              alt={mangaData?.title} 
            />
          </div>

          {/* Bloque de Información */}
          <div className="flex-1 text-center md:text-left">
            {/* Categorías y Estado */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-5">
              {genresArray.map((genre: string) => (
                <span key={genre} className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-zinc-300">
                  {genre}
                </span>
              ))}
              {mangaData?.status && (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-red-600/20 px-3 py-1.5 rounded-md border border-red-600/30 text-red-500 italic">
                  {mangaData.status}
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-2 leading-none drop-shadow-2xl">
              {mangaData?.title || actualFolderName}
            </h1>
            
            <p className="text-zinc-500 font-bold mb-6 italic text-lg tracking-tight">
              {mangaData?.author || "Nexus Library"}
            </p>

            {/* Caja de Sinopsis */}
            <div className="max-w-3xl bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 mb-8 shadow-inner">
              <p className="text-zinc-300 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-700 cursor-help">
                {mangaData?.description || "Buscando información detallada en los archivos del sistema..."}
              </p>
            </div>

            <div className="flex justify-center md:justify-start">
              <FavoriteButton title={actualFolderName} cover={localCover} />
            </div>
          </div>
        </div>
      </section>

      {/* --- LISTA DE CAPÍTULOS: DISEÑO LIMPIO --- */}
      <section className="max-w-5xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Índice de Archivos</h2>
          </div>
          <span className="text-[10px] font-black text-zinc-500 bg-zinc-900/80 border border-white/5 px-5 py-2.5 rounded-full uppercase tracking-[0.3em]">
            {chapters.length} Volúmenes
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {chapters.map((chapter) => {
            // Limpieza visual: evita que el nombre del manga se repita en el título del capítulo
            let displayTitle = chapter.replace(/\.[^/.]+$/, ""); 
            const mangaName = mangaData?.title || actualFolderName;
            const regex = new RegExp(mangaName, 'gi');
            displayTitle = displayTitle.replace(regex, '').replace(/^[\s-_]+|[\s-_]+$/g, '').trim();
            
            if (!displayTitle) displayTitle = chapter.replace(/\.[^/.]+$/, "");

            return (
              <Link 
                key={chapter} 
                href={`/manga/${encodeURIComponent(actualFolderName)}/${encodeURIComponent(chapter)}`} 
                className="group flex items-center gap-6 p-5 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900/80 transition-all duration-300 border border-white/5 hover:border-red-600/40 shadow-sm"
              >
                {/* Miniatura de capítulo */}
                <div className="w-16 h-24 bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative">
                  <img 
                    src={`/api/cover?series=${encodeURIComponent(actualFolderName)}&chapter=${encodeURIComponent(chapter)}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <LastReadBadge title={actualFolderName} chapter={chapter} />
                  </div>
                  <h3 className="font-black text-zinc-300 group-hover:text-white uppercase text-lg tracking-tight transition-colors truncate">
                    {displayTitle}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Type: {chapter.split('.').pop()}</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">FileSystem Local</span>
                  </div>
                </div>

                {/* Acción lateral */}
                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                   <span className="hidden sm:block text-red-600 text-[10px] font-black uppercase tracking-widest italic">Leer ahora</span>
                   <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                   </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CSS Utility para ocultar el scrollbar en los géneros pero permitir scroll horizontal */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}