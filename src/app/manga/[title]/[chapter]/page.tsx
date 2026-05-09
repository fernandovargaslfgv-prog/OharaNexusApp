import fs from "fs";
import path from "path";
// @ts-ignore
import AdmZip from "adm-zip";
import Link from "next/link";
import MangaReader from "@/components/MangaReader";

// Definimos la ruta raíz donde están tus archivos
const MANGA_ROOT = process.env.MANGA_PATH || "/home/luis/mangas/General/mangas";

export default async function MangaReaderPage(props: { params: Promise<{ title: string; chapter: string }> }) {
  const params = await props.params;
  const { title, chapter } = params;
  
  // Decodificamos para manejar espacios y caracteres especiales
  const decodedTitle = decodeURIComponent(title);
  const decodedChapter = decodeURIComponent(chapter);

  const mangaDir = path.join(MANGA_ROOT, decodedTitle);
  const filePath = path.join(mangaDir, decodedChapter);

  let images: string[] = [];
  let coverImage = ""; 
  let error = null;

  try {
    // Verificación de existencia del archivo
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${decodedChapter}`);
    }

    // --- 1. LÓGICA DE PORTADA (Metadata para el historial) ---
    // Buscamos una imagen de portada real en la carpeta del manga
    const coverNames = ["cover.jpg", "cover.png", "cover.webp", "folder.jpg", "thumb.jpg"];
    for (const name of coverNames) {
      const coverPath = path.join(mangaDir, name);
      if (fs.existsSync(coverPath)) {
        const content = fs.readFileSync(coverPath);
        const ext = path.extname(name).toLowerCase().replace(".", "");
        coverImage = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${content.toString("base64")}`;
        break;
      }
    }

    // --- 2. EXTRACCIÓN DE IMÁGENES DEL ZIP ---
    const zip = new AdmZip(filePath);
    images = zip.getEntries()
      .filter((entry: any) => !entry.isDirectory && /\.(jpg|jpeg|png|webp)$/i.test(entry.entryName))
      // Orden numérico natural (1, 2, 10 en lugar de 1, 10, 2)
      .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))
      .map((entry: any) => {
        const content = zip.readFile(entry);
        if (!content) return null;
        const base64 = content.toString("base64");
        const ext = path.extname(entry.entryName).toLowerCase().replace(".", "");
        return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${base64}`;
      })
      .filter((img): img is string => img !== null);

    if (images.length === 0) {
      throw new Error("El archivo comprimido no contiene imágenes válidas.");
    }

    // Si no hay portada en la carpeta, usamos la primera página como fallback
    if (!coverImage && images.length > 0) {
      coverImage = images[0];
    }

  } catch (e: any) {
    console.error("Error en servidor:", e.message);
    error = e.message;
  }

  // Vista de Error estilizada
  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <div className="w-16 h-16 bg-red-600/20 text-red-600 rounded-full flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h1 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Fallo en la lectura</h1>
      <p className="text-zinc-500 mb-8 text-xs max-w-xs leading-relaxed uppercase font-bold tracking-widest">{error}</p>
      <Link 
        href={`/manga/${title}`} 
        className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 hover:text-white transition-all active:scale-90"
      >
        Volver al índice
      </Link>
    </div>
  );

  // Todo correcto: Renderizamos el componente de cliente con los datos
  return (
    <MangaReader 
      images={images} 
      title={decodedTitle} 
      chapter={decodedChapter} 
      coverImage={coverImage} 
    />
  );
}