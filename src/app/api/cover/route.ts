import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';
import sharp from 'sharp';

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";
const CACHE_ROOT = "/app/cover_cache";

/**
 * Extrae la primera imagen válida de un archivo comprimido (.cbz, .zip)
 */
function getFirstImageFromZip(zipPath: string): Buffer | null {
    console.log(`[Cover API] 📦 Abriendo ZIP/CBZ: ${zipPath}`);
    try {
        if (!fs.existsSync(zipPath)) return null;
        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        
        const firstImageEntry = entries
          .filter((e: any) => !e.isDirectory && /\.(jpg|jpeg|png|webp|avif)$/i.test(e.entryName) && !e.entryName.includes('__MACOSX'))
          .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))[0];

        if (firstImageEntry) {
          console.log(`[Cover API] 🖼️ Imagen extraída: ${firstImageEntry.entryName}`);
          return firstImageEntry.getData();
        }
    } catch (err: any) {
        console.error(`[Cover API] ❌ ERROR al abrir ZIP:`, err.message);
    }
    return null;
}

/**
 * Busca la primera imagen en un directorio
 */
function getFirstImageFromDir(dirPath: string): Buffer | null {
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        const img = files
          .filter(f => f.isFile() && /\.(jpg|jpeg|png|webp|avif)$/i.test(f.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0];
        if (img) return fs.readFileSync(path.join(dirPath, img.name));
    } catch(e: any) {
        console.error(`[Cover API] ❌ Error en directorio:`, e.message);
    }
    return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesRaw = searchParams.get('series');
  const chapterRaw = searchParams.get('chapter'); 

  if (!seriesRaw) return new NextResponse("Missing series", { status: 400 });

  const series = decodeURIComponent(seriesRaw).normalize("NFC");
  const chapter = chapterRaw ? decodeURIComponent(chapterRaw).normalize("NFC") : null;

  const safeSeriesName = series.replace(/[/\\?%*:|"<>]/g, '-');
  const safeChapterName = chapter ? chapter.replace(/[/\\?%*:|"<>]/g, '-') : 'main-cover';
  const cacheDir = path.join(CACHE_ROOT, safeSeriesName);
  const cachePath = path.join(cacheDir, `${safeChapterName}.webp`);

  // 1. INTENTAR LEER DE CACHÉ (Uint8Array corregido para TS)
  if (fs.existsSync(cachePath)) {
    const cacheBuffer = fs.readFileSync(cachePath);
    return new NextResponse(new Uint8Array(cacheBuffer), { 
        headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } 
    });
  }

  try {
    const seriesPath = path.join(MANGA_ROOT, series);
    if (!fs.existsSync(seriesPath)) {
        return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
    }

    let rawBuffer: Buffer | null = null;

    if (chapter) {
        // --- PORTADA DE CAPÍTULO ---
        const baseChapPath = path.join(seriesPath, chapter);
        
        if (fs.existsSync(baseChapPath)) {
            if (fs.statSync(baseChapPath).isDirectory()) {
                rawBuffer = getFirstImageFromDir(baseChapPath);
            } else {
                rawBuffer = getFirstImageFromZip(baseChapPath);
            }
        } else {
            // Intento de búsqueda elástica (con extensiones)
            const extensions = ['.cbz', '.zip', '.cbr'];
            for (const ext of extensions) {
                if (fs.existsSync(baseChapPath + ext)) {
                    rawBuffer = getFirstImageFromZip(baseChapPath + ext);
                    if (rawBuffer) break;
                }
            }
        }
    } else {
        // --- PORTADA PRINCIPAL DE LA SERIE ---
        const possibleCovers = ['cover.jpg', 'cover.png', 'cover.webp', 'poster.jpg', 'folder.jpg'];
        for (const pc of possibleCovers) {
            const pcPath = path.join(seriesPath, pc);
            if (fs.existsSync(pcPath)) {
                rawBuffer = fs.readFileSync(pcPath);
                break;
            }
        }

        if (!rawBuffer) {
            const files = fs.readdirSync(seriesPath, { withFileTypes: true })
                            .filter(f => !f.name.startsWith('.'))
                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            for (const f of files) {
                const fullPath = path.join(seriesPath, f.name);
                if (f.isDirectory()) rawBuffer = getFirstImageFromDir(fullPath);
                else if (/\.(cbz|zip)$/i.test(f.name)) rawBuffer = getFirstImageFromZip(fullPath);
                else if (/\.(jpg|jpeg|png|webp)$/i.test(f.name)) rawBuffer = fs.readFileSync(fullPath);
                if (rawBuffer) break; 
            }
        }
    }

    if (!rawBuffer) {
        return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
    }

    // 2. PROCESAMIENTO CON SHARP (Uint8Array corregido para TS)
    const width = chapter ? 200 : 400;
    const height = chapter ? 300 : 600;

    const optimizedBuffer = await sharp(rawBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .webp({ quality: 75 })
      .toBuffer();

    // 3. GUARDAR EN CACHÉ Y RESPONDER
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cachePath, optimizedBuffer);

    return new NextResponse(new Uint8Array(optimizedBuffer), { 
        headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } 
    });

  } catch (e: any) {
    console.error(`[Cover API] 🔥 ERROR FATAL:`, e.message);
    return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
  }
}