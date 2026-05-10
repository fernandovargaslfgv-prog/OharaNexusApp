import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import * as unrar from "node-unrar-js";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");
  const fileName = searchParams.get("fileName");

  if (!mangaId || !fileName) return new NextResponse("Faltan parámetros", { status: 400 });

  const manga = await db.query.mangas.findFirst({
    where: eq(mangas.id, parseInt(mangaId)),
  });

  if (!manga) return new NextResponse("Manga no encontrado", { status: 404 });

  const filePath = path.join(manga.path, fileName);
  const ext = path.extname(filePath).toLowerCase();

  try {
    let buffer: Buffer | null = null;
    let contentType = "image/jpeg";

    if (ext === ".cbz" || ext === ".zip") {
      const zip = new AdmZip(filePath);
      const firstImage = zip.getEntries()
        .filter(e => !e.isDirectory && IMAGE_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
        .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))[0];
      
      if (firstImage) {
        buffer = firstImage.getData();
        contentType = `image/${path.extname(firstImage.name).slice(1)}`;
      }
    } else if (ext === ".cbr") {
      const data = Uint8Array.from(fs.readFileSync(filePath)).buffer;
      const extractor = await unrar.createExtractorFromData({ data });
      const list = extractor.getFileList();
      const firstImageName = Array.from(list.fileHeaders)
        .map(h => h.name)
        .filter(name => IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];

      if (firstImageName) {
        const extracted = extractor.extract({ files: [firstImageName] });
        const fileData = extracted.files.next().value;
        if (fileData && fileData.extraction) {
          buffer = Buffer.from(fileData.extraction);
          contentType = `image/${path.extname(firstImageName).slice(1)}`;
        }
      }
    }

    if (!buffer) return new NextResponse(null, { status: 404 });

    // 1. Convertimos el Buffer de Node.js a un formato Web Estándar (Uint8Array)
    const imageBytes = new Uint8Array(buffer);

    // 2. Usamos el 'Response' nativo de la web en lugar de NextResponse
    return new Response(imageBytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache por 24h para que vuele
      },
    });
  } catch (e: any) {
    console.error("Error cargando portada de capítulo:", e.message);
    return new Response("Error del servidor", { status: 500 });
  }
}