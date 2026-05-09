import fs from 'fs';
import path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

// Esta es la variable maestra que detecta si estamos en Docker o Local
export const MANGAS_PATH = process.env.MANGA_PATH || '/home/luis/mangas/General/mangas';

export async function fetchKavitaLibrary() {
  try {
    const seriesFolders = fs.readdirSync(MANGAS_PATH);
    const library = seriesFolders.map(folderName => {
      const folderPath = path.join(MANGAS_PATH, folderName);
      if (fs.lstatSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.cbz'));
        const stats = fs.statSync(folderPath);
        return {
          id: folderName,
          title: folderName,
          chapter: `${files.length} capítulos`,
          image: `/api/cover?series=${encodeURIComponent(folderName)}`,
          category: "Manga",
          lastModified: stats.mtime
        };
      }
      return null;
    }).filter(Boolean);
    library.sort((a, b) => new Date(b!.lastModified).getTime() - new Date(a!.lastModified).getTime());
    return library;
  } catch (error) {
    console.error("Error leyendo carpetas locales:", error);
    return [];
  }
}

export async function fetchMangaLibrary() {
  try {
    const seriesFolders = fs.readdirSync(MANGAS_PATH);
    const parser = new XMLParser();
    const library = await Promise.all(
      seriesFolders.map(async (folderName) => {
        const folderPath = path.join(MANGAS_PATH, folderName);
        if (!fs.lstatSync(folderPath).isDirectory()) return null;
        const cbzFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.cbz'));
        if (cbzFiles.length === 0) return null;

        const firstCbzPath = path.join(folderPath, cbzFiles[0]);
        let author = 'Desconocido';
        try {
          const zip = new AdmZip(firstCbzPath);
          const comicInfoEntry = zip.getEntries().find((entry: any) =>
            entry.entryName.toLowerCase() === 'comicinfo.xml'
          );
          if (comicInfoEntry) {
            const xmlContent = zip.readAsText(comicInfoEntry);
            const parsedXml = parser.parse(xmlContent);
            if (parsedXml?.ComicInfo?.Writer) author = parsedXml.ComicInfo.Writer;
          }
        } catch (error) {
          console.warn(`Error leyendo ComicInfo.xml para ${folderName}:`, error);
        }

        return {
          title: folderName,
          author: author,
          image: `/api/cover?series=${encodeURIComponent(folderName)}`,
          latestChapter: cbzFiles.length
        };
      })
    );
    return library.filter(Boolean);
  } catch (error) {
    console.error("Error leyendo biblioteca de manga:", error);
    return [];
  }
}