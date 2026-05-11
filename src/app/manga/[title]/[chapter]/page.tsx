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
    where: or(eq(mangas.title, decodedTitle), eq(mangas.path, decodedTitle)),
  });

  const folderName = mangaData?.path || decodedTitle;
  const chapterFilePath = path.join(MANGA_ROOT, folderName, decodedChapter);

  let imageUrls: string[] = [];
  if (fs.existsSync(chapterFilePath)) {
    try {
      const zip = new AdmZip(chapterFilePath);
      imageUrls = zip.getEntries()
        .filter((e: any) => !e.isDirectory && /\.(jpg|jpeg|png|webp)$/i.test(e.entryName))
        .map((e: any) => e.entryName)
        .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }))
        .map((img: string) => `/api/render-page?series=${encodeURIComponent(folderName)}&chapter=${encodeURIComponent(decodedChapter)}&page=${encodeURIComponent(img)}`);
    } catch (e) { console.error(e); }
  }

  return (
    <main className="bg-black min-h-screen text-white">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h1 className="text-xs font-black uppercase text-red-600 italic">{mangaData?.title || folderName}</h1>
        <Link href={`/manga/${encodeURIComponent(folderName)}`} className="text-[10px] font-black bg-zinc-900 px-4 py-2 rounded-full italic">SALIR</Link>
      </div>
      <MangaReader 
        title={folderName} 
        chapter={decodedChapter} 
        images={imageUrls} 
        coverImage={`/api/cover?series=${encodeURIComponent(folderName)}`} 
      />
    </main>
  );
}