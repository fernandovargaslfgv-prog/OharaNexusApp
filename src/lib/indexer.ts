import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import * as unrar from "node-unrar-js"; 
import { db } from "../db";
import { mangas, libraries as librariesTable } from "../db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_EXTENSIONS = [".cbz", ".cbr", ".pdf", ".epub", ".zip"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function scanLibrary(libraryId: number) {
  const library = await db.query.libraries.findFirst({
    where: eq(librariesTable.id, libraryId),
  });

  if (!library) {
    throw new Error("Librería no encontrada");
  }

  // Guardamos la ruta en una constante para que TypeScript no se queje
  const rootPath = library.path;

  console.log(`🚀 Iniciando escaneo agrupado en: ${rootPath}`);

  async function recursiveScan(currentPath: string) {
    const entities = fs.readdirSync(currentPath, { withFileTypes: true });

    const hasArchives = entities.some(ent => !ent.isDirectory() && ALLOWED_EXTENSIONS.includes(path.extname(ent.name).toLowerCase()));
    const hasImages = entities.some(ent => !ent.isDirectory() && IMAGE_EXTENSIONS.includes(path.extname(ent.name).toLowerCase()));

    if (hasArchives || hasImages) {
      const title = path.basename(currentPath);
      
      // Usamos rootPath aquí (la constante segura)
      if (currentPath !== rootPath) {
        await processManga(title, currentPath, "folder", entities.map(e => e.name));
        return; 
      }
    }

    for (const ent of entities) {
      if (ent.isDirectory()) {
        await recursiveScan(path.join(currentPath, ent.name));
      } else if (currentPath === rootPath) {
        const ext = path.extname(ent.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          await processManga(ent.name, path.join(currentPath, ent.name), "file");
        }
      }
    }
  }

  // --- EXTRACCIÓN DE PORTADAS ---

  function extractZipCover(filePath: string): string | null {
    try {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      const firstImage = zipEntries
        .filter(e => !e.isDirectory && IMAGE_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
        .sort((a, b) => a.entryName.localeCompare(b.entryName))[0];

      if (firstImage) {
        const buffer = firstImage.getData();
        return `data:image/${path.extname(firstImage.name).slice(1)};base64,${buffer.toString("base64")}`;
      }
    } catch (e) { return null; }
    return null;
  }

  async function extractRarCover(filePath: string): Promise<string | null> {
    try {
      const data = Uint8Array.from(fs.readFileSync(filePath)).buffer;
      const extractor = await unrar.createExtractorFromData({ data });
      const list = extractor.getFileList();
      const fileHeaders = Array.from(list.fileHeaders); 
      const firstImageName = fileHeaders
        .map(h => h.name)
        .filter(name => IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase()))
        .sort((a, b) => a.localeCompare(b))[0];

      if (firstImageName) {
        const extracted = extractor.extract({ files: [firstImageName] });
        const fileData = extracted.files.next().value;
        if (fileData && fileData.extraction) {
          return `data:image/${path.extname(firstImageName).slice(1)};base64,${Buffer.from(fileData.extraction).toString("base64")}`;
        }
      }
    } catch (e) { return null; }
    return null;
  }

  async function processManga(title: string, mangaPath: string, type: "folder" | "file", files: string[] = []) {
    let coverBase64 = "";

    if (type === "folder") {
      const coverFile = files.find(f => 
        IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()) && 
        (f.toLowerCase().includes("cover") || f.toLowerCase().includes("folder") || f.toLowerCase().includes("thumb"))
      );
      
      if (coverFile) {
        const buffer = fs.readFileSync(path.join(mangaPath, coverFile));
        coverBase64 = `data:image/${path.extname(coverFile).slice(1)};base64,${buffer.toString("base64")}`;
      } else {
        const firstArchive = files
          .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
          .sort((a, b) => a.localeCompare(b))[0];
        
        if (firstArchive) {
          const archivePath = path.join(mangaPath, firstArchive);
          const ext = path.extname(firstArchive).toLowerCase();
          if (ext === ".cbz" || ext === ".zip") {
            coverBase64 = extractZipCover(archivePath) || "";
          } else if (ext === ".cbr") {
            coverBase64 = await extractRarCover(archivePath) || "";
          }
        }
      }
    } else {
      coverBase64 = extractZipCover(mangaPath) || await extractRarCover(mangaPath) || "";
    }

    console.log(`📦 Registrando Manga: ${title}`);

    await db.insert(mangas).values({
      title: title.replace(/\.[^/.]+$/, ""),
      path: mangaPath,
      cover: coverBase64 || null,
      author: "Nexus Library",
      lastScan: Date.now(),
    }).onConflictDoUpdate({
      target: mangas.path,
      set: { 
        lastScan: Date.now(),
        ...(coverBase64 ? { cover: coverBase64 } : {})
      }
    });
  }

  await recursiveScan(rootPath);
  console.log("✅ Escaneo Agrupado completado.");
}