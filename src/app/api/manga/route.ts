import { NextResponse } from "next/server";
import { db } from "../../../db"; // Cambiado a ruta relativa por seguridad
import { mangas } from "../../../db/schema";
import { desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("📡 Consultando base de datos...");
    const allMangas = await db.select({
      id: mangas.id,
      title: mangas.title,
      author: mangas.author,
    }).from(mangas).orderBy(desc(mangas.lastScan));

    const mangaData = allMangas.map((m) => ({
      title: m.title,
      author: m.author || "Nexus Library",
      image: `/api/cover?id=${m.id}`, 
      latestChapter: "Cap. Reciente", 
    }));

    return NextResponse.json(mangaData);
  } catch (error: any) {
    // Esto imprimirá el error real en los logs de Docker
    console.error("❌ Error en API Manga:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}