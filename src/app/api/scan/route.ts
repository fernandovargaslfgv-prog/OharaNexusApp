import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchAnilistMetadata } from "@/lib/anilist";

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";

// Función auxiliar para limpiar el nombre antes de buscar en AniList
function cleanNameForSearch(name: string) {
  return name
    .replace(/\(.*\)/g, "") // Quita (2023), (1997), etc.
    .replace(/\[.*\]/g, "") // Quita [Digital], [CBR], etc.
    .replace(/[_-]/g, " ")  // Cambia guiones y barras bajas por espacios
    .trim();
}

export async function GET() {
  try {
    const folders = fs.readdirSync(MANGA_ROOT, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

    console.log(`🚀 Iniciando Escaneo Profundo para ${folders.length} carpetas...`);

    for (const folder of folders) {
      const folderName = folder.name;
      const cleanSearchTitle = cleanNameForSearch(folderName);

      const existing = await db.query.mangas.findFirst({
        where: (mangas, { eq }) => eq(mangas.path, folderName)
      });

      // CONDICIÓN: Si no existe O si existe pero la descripción es la de por defecto
      const needsMetadata = !existing || !existing.description || existing.description.includes("Sin descripción disponible");

      if (needsMetadata) {
        console.log(`🔍 Buscando en AniList: "${cleanSearchTitle}" (Carpeta: ${folderName})`);
        
        const meta = await fetchAnilistMetadata(cleanSearchTitle);

        if (meta) {
          const dataToSave = {
            path: folderName,
            title: meta.title.romaji || meta.title.english || folderName,
            description: meta.description || "Sin descripción disponible.",
            status: meta.status || "Desconocido",
            genres: meta.genres ? JSON.stringify(meta.genres) : "[]",
            bannerImage: meta.bannerImage || null,
            coverImage: meta.coverImage?.extraLarge || meta.coverImage?.large || null,
            anilistId: meta.id || null,
            updatedAt: new Date()
          };

          if (!existing) {
            await db.insert(mangas).values(dataToSave);
            console.log(`✅ Nuevo: ${folderName} guardado con éxito.`);
          } else {
            await db.update(mangas).set(dataToSave).where(eq(mangas.id, existing.id));
            console.log(`🔄 Actualizado: ${folderName} ya tiene metadatos oficiales.`);
          }
        } else {
          // Si no hay meta pero el manga no existe en DB, creamos el registro básico
          if (!existing) {
            await db.insert(mangas).values({
              path: folderName,
              title: folderName,
              description: "Sin descripción disponible.",
              updatedAt: new Date()
            });
            console.log(`⚠️ No se halló meta para ${folderName}, creado registro base.`);
          } else {
            console.log(`❌ Seguimos sin metadatos para: ${folderName}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Sincronización de metadatos completada." });
  } catch (error: any) {
    console.error("❌ Error en el escaneo:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}