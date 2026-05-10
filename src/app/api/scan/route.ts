import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";

// La ruta que usa Docker para ver tus mangas
const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";

export async function GET() {
  try {
    console.log(`[Escáner] Iniciando búsqueda en: ${MANGA_ROOT}`);
    
    // Verificamos si la carpeta existe
    if (!fs.existsSync(MANGA_ROOT)) {
      return NextResponse.json({ error: `La carpeta ${MANGA_ROOT} no existe en el contenedor.` }, { status: 404 });
    }

    const folders = fs.readdirSync(MANGA_ROOT, { withFileTypes: true });
    let addedCount = 0;

    for (const dirent of folders) {
      // Ignorar archivos ocultos o de sistema
      if (dirent.name.startsWith('.')) continue;

      // De momento, nuestro indexador asume que cada carpeta es un manga
      if (dirent.isDirectory()) {
        const title = dirent.name;
        const fullPath = path.join(MANGA_ROOT, title);

        // Comprobar si este manga ya está en la Base de Datos
        const existingManga = await db.select().from(mangas).where(eq(mangas.title, title)).get();

        if (!existingManga) {
          // Si no existe, lo creamos en la DB
          await db.insert(mangas).values({
            title: title,
            path: fullPath,
            author: "Nexus Library",
            // Dejamos una portada por defecto que luego mejoraremos
            cover: `/api/cover?series=${encodeURIComponent(title)}`, 
          });
          addedCount++;
          console.log(`[Escáner] Añadido a la DB: ${title}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Escaneo completado. Se han añadido ${addedCount} mangas a la base de datos.` 
    });

  } catch (error: any) {
    console.error("[Escáner] Error crítico:", error);
    return NextResponse.json({ error: "Fallo en el servidor al escanear", details: error.message }, { status: 500 });
  }
}