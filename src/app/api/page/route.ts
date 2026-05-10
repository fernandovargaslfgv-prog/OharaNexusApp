import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import * as unrar from "node-unrar-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const chapter = searchParams.get("chapter");
  const pageName = searchParams.get("pageName");

  if (!title || !chapter || !pageName) return new Response("Faltan parámetros", { status: 400 });

  const manga = await db.query.mangas.findFirst({ where: eq(mangas.title, title) });
  if (!manga) return new Response("Libro/Manga no encontrado", { status: 404 });

  const filePath = path.join(manga.path, chapter);
  const ext = path.extname(filePath).toLowerCase();

  try {
    let buffer: Buffer | null = null;
    let contentType = "image/jpeg";

    if (ext === ".cbz" || ext === ".zip") {
      const zip = new AdmZip(filePath);
      const image = zip.getEntry(pageName);
      if (image) {
        buffer = image.getData();
        contentType = `image/${path.extname(pageName).slice(1)}`;
      }
    } else if (ext === ".cbr") {
      const data = Uint8Array.from(fs.readFileSync(filePath)).buffer;
      const extractor = await unrar.createExtractorFromData({ data });
      const extracted = extractor.extract({ files: [pageName] });
      const fileData = extracted.files.next().value;
      if (fileData && fileData.extraction) {
        buffer = Buffer.from(fileData.extraction);
        contentType = `image/${path.extname(pageName).slice(1)}`;
      }
    }

    if (!buffer) return new Response("Página no encontrada", { status: 404 });

    // Convertimos el Buffer a Uint8Array para que la web lo cargue como imagen estándar
    const imageBytes = new Uint8Array(buffer);

    return new Response(imageBytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800", // Guarda la página en caché 7 días
      },
    });
  } catch (e: any) {
    console.error("Error al extraer página:", e.message);
    return new Response("Error del servidor", { status: 500 });
  }
}