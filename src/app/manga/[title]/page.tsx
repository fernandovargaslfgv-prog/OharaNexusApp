import fs from "fs";
import path from "path";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import LastReadBadge from "@/components/LastReadBadge";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq, or } from "drizzle-orm"; // Importamos 'or'

type MangaLobbyProps = {
  params: Promise<{ title: string }>;
};

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";
const ALLOWED_EXTENSIONS = new Set([".cbz", ".cbr", ".pdf", ".epub", ".zip"]);

export default async function MangaLobbyPage({ params }: MangaLobbyProps) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  
  // 1. BÚSQUEDA INTELIGENTE: Buscamos por el PATH (carpeta) o por el TÍTULO real
  const mangaData = await db.query.mangas.findFirst({
    where: or(
      eq(mangas.path, decodedTitle),
      eq(mangas.title, decodedTitle)
    ),
  });

  // 2. Determinar la carpeta física real (Priorizamos lo que diga la DB)
  const actualFolderName = mangaData?.path || decodedTitle;
  const folderPath = path.join(MANGA_ROOT, actualFolderName);

  // 3. Leemos capítulos (Usando la carpeta física confirmada)
  let chapters: string[] = [];
  try {
    if (fs.existsSync(folderPath)) {
      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
      chapters = entries
        .filter(ent => {
          if (ent.name.startsWith('.')) return false;
          const ext = path.extname(ent.name).toLowerCase();
          return ent.isDirectory() || ALLOWED_EXTENSIONS.has(ext);
        })
        .map(ent => ent.name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    }
  } catch (e) {
    console.error("Error leyendo carpeta de capítulos:", e);
  }

  // La portada debe usar siempre el nombre de la CARPETA (path)
  const mainCover = `/api/cover?series=${encodeURIComponent(actualFolderName)}`;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* PANEL SUPERIOR */}
      <section className="relative w-full pt-12 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={mainCover} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black to-black" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img 
              src={mainCover} 
              className="w-56 h-80 sm:w-64 sm:h-96 object-cover rounded-xl shadow-2xl border border-white/10"
              alt={mangaData?.title || actualFolderName}
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {mangaData?.type || "Manga"}
              </span>
              <span className="text-zinc-400 text-xs font-bold uppercase underline">
                {mangaData?.status || "Estado desconocido"}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none mb-2">
              {mangaData?.title || actualFolderName}
            </h1>
            
            <p className="text-xl text-zinc-400 font-medium mb-6 italic">
              {mangaData?.author || "Nexus Library"}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {mangaData?.genres?.split(',').map((genre) => (
                <span key={genre} className="bg-zinc-900 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-zinc-300 uppercase">
                  {genre.trim()}
                </span>
              ))}
            </div>

            <div className="max-w-2xl">
              <h3 className="text-xs font-black uppercase text-zinc-500 mb-2">Argumento</h3>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {mangaData?.description || "Sin descripción disponible en metadatos."}
              </p>
            </div>

            <div className="mt-8 flex justify-center md:justify-start">
              <FavoriteButton title={actualFolderName} cover={mainCover} />
            </div>
          </div>
        </div>
      </section>

      {/* LISTA DE CAPÍTULOS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-4">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Capítulos</h2>
          <span className="text-zinc-500 text-[10px] font-black uppercase">{chapters.length} Archivos</span>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {chapters.map((chapter, index) => {
            const chapterCoverUrl = `/api/cover?series=${encodeURIComponent(actualFolderName)}&chapter=${encodeURIComponent(chapter)}`;
            
            return (
              <Link 
                key={chapter} 
                href={`/manga/${encodeURIComponent(actualFolderName)}/${encodeURIComponent(chapter)}`} 
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900/50 transition-all border border-transparent hover:border-white/5"
              >
                <div className="relative w-20 h-14 sm:w-28 sm:h-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-white/5">
                  <img src={chapterCoverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-[10px] font-black">#{index + 1}</span>
                    <LastReadBadge title={actualFolderName} chapter={chapter} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-300 group-hover:text-white truncate">
                    {chapter.replace(/\.[^/.]+$/, "")}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}