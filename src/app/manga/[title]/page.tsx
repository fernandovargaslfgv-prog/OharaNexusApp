import fs from "fs";
import path from "path";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import LastReadBadge from "@/components/LastReadBadge";

type MangaLobbyProps = {
  params: Promise<{ title: string }>;
};

// Rutas configuradas en docker-compose
const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";
// Ampliamos extensiones para coincidir con el indexador
const ALLOWED_EXTENSIONS = new Set([".cbz", ".cbr", ".pdf", ".epub", ".zip"]);

export default async function MangaLobbyPage({ params }: MangaLobbyProps) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  
  // 1. Buscamos la carpeta real con tolerancia a mayúsculas/espacios
  let actualFolderName = decodedTitle;
  try {
    const folders = await fs.promises.readdir(MANGA_ROOT);
    const match = folders.find(f => 
      f.trim().toLowerCase() === decodedTitle.trim().toLowerCase()
    );
    if (match) actualFolderName = match;
  } catch (e) {
    console.error("Error leyendo directorio raíz:", e);
  }

  const folderPath = path.join(MANGA_ROOT, actualFolderName);

  // 2. Leemos los capítulos (Archivos soportados O carpetas)
  let chapters: string[] = [];
  try {
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
    chapters = entries
      .filter(ent => {
        if (ent.name.startsWith('.')) return false; // Ignorar archivos ocultos
        const ext = path.extname(ent.name).toLowerCase();
        // Aceptamos si es una carpeta O si es un archivo con extensión permitida
        return ent.isDirectory() || ALLOWED_EXTENSIONS.has(ext);
      })
      .map(ent => ent.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } catch (e) {
    console.error("Error leyendo carpeta de capítulos:", e);
  }

  // CORRECCIÓN 1: Dejamos que el "Cerebro" de la API decida la mejor portada principal
  const mainCover = `/api/cover?series=${encodeURIComponent(actualFolderName)}`;

  return (
    <main className="min-h-screen bg-black text-white pb-24 md:pb-10">
      <section className="relative w-full h-[400px] sm:h-[500px] overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={mainCover} className="w-full h-full object-cover opacity-60 brightness-[0.3] blur-[2px] scale-105" alt="Fondo" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto h-full px-6 flex flex-col justify-end pb-16 sm:pb-28">
           <h1 className="text-4xl sm:text-7xl font-black uppercase italic tracking-tighter mb-6 text-white drop-shadow-2xl leading-none">
             {actualFolderName}
           </h1>
           <FavoriteButton title={actualFolderName} cover={mainCover} />
        </div>
      </section>

      <section className="relative z-30 bg-[#0a0a0a] rounded-t-[40px] -mt-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20">
          <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 px-2">
            <h2 className="text-sm sm:text-xl font-black uppercase italic tracking-tighter text-zinc-400">Lista de capítulos</h2>
            <span className="bg-zinc-900 px-3 py-1 rounded-full text-zinc-500 text-[10px] font-black uppercase">{chapters.length} Disponibles</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {chapters.map((chapter, index) => {
                // CORRECCIÓN 2: URL a prueba de bombas para la portada de cada capítulo (con encodeURIComponent)
                const chapterCoverUrl = `/api/cover?series=${encodeURIComponent(actualFolderName)}&chapter=${encodeURIComponent(chapter)}`;

                return (
                  <Link 
                    key={chapter} 
                    href={`/manga/${encodeURIComponent(actualFolderName)}/${encodeURIComponent(chapter)}`} 
                    className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5"
                  >
                    {/* NUEVO: Miniatura de la portada del capítulo */}
                    <img 
                      src={chapterCoverUrl} 
                      alt={`Portada de ${chapter}`}
                      loading="lazy" 
                      className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded-md shadow-md border border-white/5 bg-zinc-900 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-600 text-[10px] font-black uppercase">#{index + 1}</span>
                        <LastReadBadge title={actualFolderName} chapter={chapter} />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-zinc-300 group-hover:text-white truncate">
                        {chapter.replace(/\.[^/.]+$/, "")}
                      </h3>
                    </div>
                    <div className="pr-4 text-zinc-700 font-black text-[10px]">LEER →</div>
                  </Link>
                );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}