import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import * as unrar from "node-unrar-js";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function getMangaImages(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo no existe: ${filePath}`);
  }

  if (ext === ".cbz" || ext === ".zip") {
    const zip = new AdmZip(filePath);
    return zip.getEntries()
      .filter(e => !e.isDirectory && IMAGE_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
      .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))
      .map(e => e.name); // MAGIA: Solo devolvemos los nombres, 0 peso.
  }

  if (ext === ".cbr") {
    const data = Uint8Array.from(fs.readFileSync(filePath)).buffer;
    const extractor = await unrar.createExtractorFromData({ data });
    const list = extractor.getFileList();
    return Array.from(list.fileHeaders)
      .map(h => h.name)
      .filter(name => IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // MAGIA: Solo nombres
  }

  throw new Error("Formato no soportado");
}