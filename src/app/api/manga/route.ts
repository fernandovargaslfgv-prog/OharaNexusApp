import { NextResponse } from "next/server";
import { db } from "../../../db"; 
import { mangas } from "../../../db/schema";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("📡 Consultando base de datos para la Home...");
    
    // 1. Añadimos 'path' a la selección, es vital para las portadas y los links
    const allMangas = await db.select({
      id: mangas.id,
      title: mangas.title,
      author: mangas.author,
      path: mangas.path, // <--- CAMBIO CLAVE
    }).from(mangas).orderBy(desc(mangas.updatedAt)); // Ordenamos por actualización

    // 2. Formateamos los datos para que la Home los entienda perfectamente
    const mangaData = allMangas.map((m) => ({
      id: m.id,
      title: m.title,
      path: m.path,
      author: m.author || "Nexus Library",
      // CORRECCIÓN: Usamos 'series' con el 'path' de la carpeta para la portada
      image: `/api/cover?series=${encodeURIComponent(m.path)}`, 
      latestChapter: "Cap. Reciente", 
    }));

    return NextResponse.json(mangaData);
  } catch (error: any) {
    console.error("❌ Error en API Manga:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}