import fs from "fs";
import path from "path";
import Link from "next/link";
// @ts-ignore
import AdmZip from "adm-zip";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import MangaReader from "@/components/MangaReader";

type ReaderPageProps = {
  params: Promise<{ title: string; chapter: string }>;
};

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { title, chapter } = await params;
  const decodedTitle = decodeURIComponent(title);
  const decodedChapter = decodeURIComponent(chapter);

  const mangaData = await db.query.mangas.findFirst({
    where: or(
      eq(mangas.title, decodedTitle),
      eq(mangas.path, decodedTitle)
    ),
  });

  const folderName = mangaData?.path || decodedTitle;
  const mangaPath = path.join(MANGA_ROOT, folderName);
  const chapterFilePath = path.join(mangaPath, decodedChapter);

  if (!fs.existsSync(chapterFilePath)) {
    return <div className="text-white p-10 font-black">ARCHIVO NO ENCONTRADO</div>;
  }

  // --- LÓGICA PARA EXTRAER LA LISTA DE IMÁGENES ---
  let imageUrls: string[] = [];
  try {
    const zip = new AdmZip(chapterFilePath);
    const entries = zip.getEntries();
    
    // Filtramos solo archivos de imagen y ordenamos alfabéticamente
    imageUrls = entries
      .filter(e => !e.isDirectory && /\.(jpg|jpeg|png|webp|avif)$/i.test(e.entryName) && !e.entryName.includes('__MACOSX'))
      .map(e => e.entryName)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      // Creamos la URL que el componente usará para pedir cada página
      .map(imgName => `/api/render-page?series=${encodeURIComponent(folderName)}&chapter=${encodeURIComponent(decodedChapter)}&page=${encodeURIComponent(imgName)}`);
  } catch (err) {
    console.error("Error leyendo imágenes del capítulo:", err);
  }

  const chapterCoverUrl = `/api/cover?series=${encodeURIComponent(folderName)}&chapter=${encodeURIComponent(decodedChapter)}`;

  return (
  <main className="bg-black min-h-screen text-white">
     {/* ... cabecera ... */}
     <section className="relative z-10">
        <MangaReader 
          title={folderName} 
          chapter={decodedChapter} 
          images={imageUrls} // <--- ESTO NO PUEDE ESTAR VACÍO []
          coverImage={chapterCoverUrl} 
        />
     </section>
  </main>
);
}