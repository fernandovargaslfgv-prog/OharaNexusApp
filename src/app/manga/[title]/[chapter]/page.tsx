import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMangaImages } from "@/lib/localfile";
import MangaReader from "@/components/MangaReader";
import path from "path";

export default async function ChapterPage({ params }: { params: { title: string, chapter: string } }) {
  // Decodificamos los parámetros para evitar errores con espacios o símbolos
  const { title, chapter } = await params;
  const decodedTitle = decodeURIComponent(title);
  const decodedChapter = decodeURIComponent(chapter);

  // Buscamos el manga en la DB para sacar la ruta y la portada
  const manga = await db.query.mangas.findFirst({
    where: eq(mangas.title, decodedTitle),
  });

  if (!manga) return <div className="text-white p-10">Manga no encontrado</div>;

  try {
    // Unimos la carpeta del manga con el nombre del archivo del capítulo
    const fullPath = path.join(manga.path, decodedChapter);
    
    // Verificamos si la ruta ya es el archivo o si hay que usar la unión
    const finalPath = manga.path.endsWith(decodedChapter) ? manga.path : fullPath;

    const images = await getMangaImages(finalPath);

    return (
      <main className="bg-black min-h-screen">
        <MangaReader 
          images={images} 
          title={decodedTitle} 
          chapter={decodedChapter} 
          coverImage={manga.cover || ""} // <--- ESTA ES LA PROPIEDAD QUE TE PIDE EL ERROR
        />
      </main>
    );
  } catch (error: any) {
    console.error(error);
    return (
      <div className="text-white p-10">
        <h1 className="text-red-500 font-bold">Error al abrir el capítulo</h1>
        <p className="text-xs opacity-50">{error.message}</p>
      </div>
    );
  }
}