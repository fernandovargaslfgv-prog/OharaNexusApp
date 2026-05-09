import fs from "fs";
import path from "path";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import LastReadBadge from "@/components/LastReadBadge";

type MangaLobbyProps = {
  params: Promise<{ title: string }>;
};

// Configuración de rutas para Docker
const MANGA_ROOT = process.env.MANGA_PATH || "/home/luis/mangas/General/mangas";
const ARCHIVE_EXTENSIONS = new Set([".cbz", ".zip"]);

export default async function MangaLobbyPage({ params }: MangaLobbyProps) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  
  // 1. Buscamos la carpeta real
  let actualFolderName = decodedTitle;
  try {
    const folders = await fs.promises.readdir(MANGA_ROOT);
    const match = folders.find(f => 
      f.trim().toLowerCase() === decodedTitle.trim().toLowerCase() ||
      f.includes(decodedTitle) || 
      decodedTitle.includes(f)
    );
    if (match) actualFolderName = match;
  } catch (e) {
    console.error("Error leyendo directorio raíz:", e);
  }

  const folderPath = path.join(MANGA_ROOT, actualFolderName);

  // 2. Leemos los capítulos disponibles
  let chapters: string[] = [];
  try {
    const entries = await fs.promises.readdir(folderPath);
    chapters = entries
      .filter(f => ARCHIVE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } catch (e) {
    console.error("Error leyendo carpeta de capítulos:", e);
  }

  // Portada principal
  const mainCover = chapters.length > 0 
    ? `/api/cover?series=${encodeURIComponent(actualFolderName)}&chapter=${encodeURIComponent(chapters[0])}`
    : "";

  return (
    // pb-24 asegura que la barra de abajo no tape el último capítulo en el móvil
    <main className="min-h-screen bg-black text-white pb-24 md:pb-10">
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[400px] sm:h-[500px] overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src={mainCover} 
            className="w-full h-full object-cover opacity-60 brightness-[0.3] blur-[2px] scale-105" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto h-full px-6 flex flex-col justify-end pb-16 sm:pb-28">
           <h1 className="text-4xl sm:text-7xl font-black uppercase italic tracking-tighter mb-6 text-white drop-shadow-2xl leading-none">
             {actualFolderName}
           </h1>
           <FavoriteButton title={actualFolderName} cover={mainCover} />
        </div>
      </section>

      {/* --- LISTADO DE CAPÍTULOS --- */}
      <section className="relative z-30 bg-[#0a0a0a] rounded-t-[40px] -mt-10 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 px-2">
            <h2 className="text-sm sm:text-xl font-black uppercase italic tracking-tighter text-zinc-400">
              Lista de capítulos
            </h2>
            <span className="bg-zinc-900 px-3 py-1 rounded-full text-zinc-500 text-[10px] font-black uppercase">
              {chapters.length} Archivos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {chapters.map((chapter, index) => {
              const chapterLabel = chapter.replace(/\.(cbz|zip)$/i, "");
              const chapterCover = `/api/cover?series=${encodeURIComponent(actualFolderName)}&chapter=${encodeURIComponent(chapter)}`;

              return (
                <Link 
                  key={chapter} 
                  href={`/manga/${encodeURIComponent(actualFolderName)}/${encodeURIComponent(chapter)}`} 
                  className="group flex items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 active:scale-[0.98]"
                >
                  {/* Miniatura del capítulo */}
                  <div className="w-24 sm:w-44 aspect-[16/9] flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-white/5 shadow-lg">
                    <img 
                      src={chapterCover} 
                      alt={chapterLabel} 
                      loading="lazy"
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" 
                    />
                  </div>

                  {/* Información del capítulo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-600 text-[10px] font-black uppercase">
                          #{index + 1}
                        </span>
                        <LastReadBadge title={actualFolderName} chapter={chapter} />
                      </div>
                      
                      <h3 className="text-sm sm:text-lg font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                        {chapterLabel}
                      </h3>
                    </div>
                  </div>

                  <div className="hidden sm:flex pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                     </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-[#0a0a0a] py-10 text-center">
        <p className="text-zinc-800 text-[9px] font-black uppercase tracking-[0.5em]">
          Ohara Nexus Hub
        </p>
      </footer>

      {/* IMPORTANTE: No incluimos BottomNav directamente aquí si ya está en el layout global,
        pero si lo necesitas, asegúrate de que sea un Client Component.
      */}
    </main>
  );
}