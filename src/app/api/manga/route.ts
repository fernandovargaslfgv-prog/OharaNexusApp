import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Obtenemos todos los mangas con todas sus columnas (incluyendo AniList)
    const allMangas = await db.query.mangas.findMany({
      orderBy: [desc(mangas.id)]
    });

    // 2. Mapeamos los datos para que el frontend reciba lo que necesita
    const mangaData = allMangas.map((m) => {
      const localCover = `/api/cover?series=${encodeURIComponent(m.path)}`;
      
      return {
        id: m.id,
        title: m.title || m.path, // Título oficial de AniList o nombre de carpeta
        path: m.path,
        author: m.author || "Nexus Library",
        // ENVIAMOS AMBOS: El frontend decidirá cuál es mejor
        coverImage: m.coverImage, 
        bannerImage: m.bannerImage,
        // Imagen por defecto (para compatibilidad con el Grid actual)
        image: m.coverImage || localCover, 
        latestChapter: "Serie", // Aquí podrías luego cruzar con la tabla 'history'
        genres: m.genres ? JSON.parse(m.genres) : []
      };
    });

    return NextResponse.json(mangaData);
  } catch (error: any) {
    console.error("❌ Error en API Manga:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}