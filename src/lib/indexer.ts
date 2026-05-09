import fs from "fs";
import path from "path";
import { db } from "../db";
import { mangas, libraries as librariesTable } from "../db/schema";
import { eq } from "drizzle-orm";

// Soportamos más formatos ahora
const ALLOWED_EXTENSIONS = [".cbz", ".cbr", ".pdf", ".epub", ".zip"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function scanLibrary(libraryId: number) {
  const library = await db.query.libraries.findFirst({
    where: eq(librariesTable.id, libraryId),
  });

  if (!library) throw new Error("Librería no encontrada");

  console.log(`🚀 Iniciando escaneo Pro en: ${library.path}`);

  // Función interna recursiva para buscar en todas las subcarpetas
  async function recursiveScan(currentPath: string) {
    const entities = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const ent of entities) {
      const fullPath = path.join(currentPath, ent.name);

      if (ent.isDirectory()) {
        // ¿Es una carpeta de imágenes? (Contiene archivos de imagen directamente)
        const folderContent = fs.readdirSync(fullPath);
        const hasImages = folderContent.some(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()));

        if (hasImages) {
          await processManga(ent.name, fullPath, "folder", folderContent);
        } else {
          // Si no tiene imágenes, seguimos buscando más adentro
          await recursiveScan(fullPath);
        }
      } else {
        // ¿Es un archivo soportado (.cbz, .pdf, etc)?
        const ext = path.extname(ent.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          await processManga(ent.name, fullPath, "file");
        }
      }
    }
  }

  // Lógica para guardar o actualizar el manga
  async function processManga(title: string, mangaPath: string, type: "folder" | "file", files: string[] = []) {
    let coverBase64 = "";

    // Si es carpeta, buscamos la portada en los archivos
    if (type === "folder") {
      const coverFile = files.find(f => 
        IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()) && 
        (f.toLowerCase().includes("cover") || f.toLowerCase().includes("folder") || f.toLowerCase().includes("thumb"))
      );

      if (coverFile) {
        try {
          const buffer = fs.readFileSync(path.join(mangaPath, coverFile));
          coverBase64 = `data:image/${path.extname(coverFile).slice(1)};base64,${buffer.toString("base64")}`;
        } catch (e) {
          console.error(`Error leyendo portada en ${title}`);
        }
      }
    } 
    // NOTA: Para sacar portadas de un .CBZ o .PDF necesitaremos librerías extra (lo veremos en la semana 4)

    await db.insert(mangas).values({
      title: title.replace(/\.[^/.]+$/, ""), // Quitamos la extensión del nombre
      path: mangaPath,
      cover: coverBase64 || null,
      author: "Nexus Library",
      lastScan: Date.now(),
    }).onConflictDoUpdate({
      target: mangas.path,
      set: { 
        lastScan: Date.now(),
        // Solo actualizamos la portada si encontramos una nueva
        ...(coverBase64 ? { cover: coverBase64 } : {})
      }
    });
  }

  await recursiveScan(library.path);
  console.log("✅ Escaneo Pro completado.");
}