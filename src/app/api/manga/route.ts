import { NextResponse } from "next/server";
import { db } from "@/db"; // Asegúrate de que el alias @ apunte a src
import { mangas } from "@/db/schema";
import { desc, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Evita que Next.js cachee la respuesta vieja

export async function GET() {
  try {
    // 1. Consultamos la base de datos (Ultra rápido)
    // Ordenamos por los últimos escaneados para mostrar novedades arriba
    const allMangas = await db.select().from(mangas).orderBy(desc(mangas.lastScan));

    // 2. Mapeamos los datos al formato que espera tu frontend
    const mangaData = allMangas.map((m) => {
      // Si el indexador guardó una portada en Base64, la usamos. 
      // Si no, volvemos a la lógica de la API de cover.
      const imageSource = m.cover || `/api/cover?series=${encodeURIComponent(m.title)}`;

      return {
        title: m.title,
        author: m.author || "Nexus Library",
        image: imageSource,
        // Por ahora enviamos un texto, luego en la Fase 2 
        // podemos contar los archivos reales en la DB
        latestChapter: "Cap. Reciente", 
      };
    });

    return NextResponse.json(mangaData);
  } catch (error: any) {
    console.error("Error en API Manga (DB):", error);
    return NextResponse.json(
      { error: "Error al leer la base de datos", details: error.message }, 
      { status: 500 }
    );
  }
}