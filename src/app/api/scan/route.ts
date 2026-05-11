import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
// @ts-ignore
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { db } from "@/db";
import { mangas, libraries } from "@/db/schema";
import { eq } from "drizzle-orm";

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";
const parser = new XMLParser();

export async function GET() {
  try {
    // 1. Asegurar Librería
    let library = await db.query.libraries.findFirst();
    if (!library) {
      const newLib = await db.insert(libraries).values({ name: "Principal", path: MANGA_ROOT }).returning();
      library = newLib[0];
    }

    // 2. LEER SOLO CARPETAS (Esto evita que los archivos .cbz salgan en el inicio)
    const folders = fs.readdirSync(MANGA_ROOT, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

    for (const folder of folders) {
      const mangaFolderName = folder.name; // Ej: "Berserk"
      const fullPath = path.join(MANGA_ROOT, mangaFolderName);
      
      const files = fs.readdirSync(fullPath)
        .filter(f => /\.(cbz|zip|cbr)$/i.test(f))
        .sort();

      let metadata = {
        title: mangaFolderName, // Por defecto el nombre de la carpeta
        author: "Autor desconocido",
        description: "Sin descripción.",
        genres: ""
      };

      // Intentar leer ComicInfo del primer archivo
      if (files.length > 0) {
        try {
          const zip = new AdmZip(path.join(fullPath, files[0]));
          const xmlEntry = zip.getEntry("ComicInfo.xml");
          if (xmlEntry) {
            const info = parser.parse(xmlEntry.getData().toString("utf8")).ComicInfo;
            metadata.title = info.Title || info.Series || mangaFolderName;
            metadata.author = info.Writer || info.Author || "Desconocido";
            metadata.description = info.Summary || "Sin descripción.";
            metadata.genres = info.Genre || "";
          }
        } catch (e) { console.log("Sin XML en", mangaFolderName); }
      }

      // Guardar en DB (Buscamos por PATH para no duplicar)
      const existing = await db.query.mangas.findFirst({ where: eq(mangas.path, mangaFolderName) });

      if (existing) {
        await db.update(mangas).set({
          title: metadata.title,
          author: metadata.author,
          description: metadata.description,
          genres: metadata.genres,
        }).where(eq(mangas.id, existing.id));
      } else {
        await db.insert(mangas).values({
          title: metadata.title,
          path: mangaFolderName,
          author: metadata.author,
          description: metadata.description,
          genres: metadata.genres,
          libraryId: library.id
        });
      }
    }

    return NextResponse.json({ success: true, message: "Biblioteca limpia y organizada" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}