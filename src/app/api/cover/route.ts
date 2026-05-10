import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';
import sharp from 'sharp';

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";
const CACHE_ROOT = "/app/cover_cache";

function getFirstImageFromZip(zipPath: string): Buffer | null {
    console.log(`[Cover API] 📦 Abriendo ZIP/CBZ: ${zipPath}`);
    try {
        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        console.log(`[Cover API] 📦 ZIP contiene ${entries.length} archivos.`);
        
        const firstImageEntry = entries
          .filter((e: any) => !e.isDirectory && /\.(jpg|jpeg|png|webp|avif)$/i.test(e.entryName) && !e.entryName.includes('__MACOSX'))
          .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))[0];

        if (firstImageEntry) {
          console.log(`[Cover API] 🖼️ Imagen extraída: ${firstImageEntry.entryName}`);
          return zip.readFile(firstImageEntry) as Buffer;
        } else {
          console.log(`[Cover API] ⚠️ No hay imágenes válidas en el ZIP.`);
        }
    } catch (err: any) {
        console.error(`[Cover API] ❌ ERROR CRÍTICO al abrir ZIP:`, err.message);
    }
    return null;
}

function getFirstImageFromDir(dirPath: string): Buffer | null {
    console.log(`[Cover API] 📁 Buscando en directorio: ${dirPath}`);
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        const img = files
          .filter(f => f.isFile() && /\.(jpg|jpeg|png|webp|avif)$/i.test(f.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0];
        if (img) {
            console.log(`[Cover API] 🖼️ Imagen encontrada: ${img.name}`);
            return fs.readFileSync(path.join(dirPath, img.name));
        }
    } catch(e: any) {
        console.error(`[Cover API] ❌ Error leyendo directorio:`, e.message);
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

  console.log(`\n=========================================`);
  console.log(`[Cover API] 🚀 NUEVA PETICIÓN -> Serie: "${series}" | Cap: "${chapter || 'PORTADA MAIN'}"`);

  const safeSeriesName = series.replace(/[/\\?%*:|"<>]/g, '-');
  const safeChapterName = chapter ? chapter.replace(/[/\\?%*:|"<>]/g, '-') : 'main-cover';
  const cacheDir = path.join(CACHE_ROOT, safeSeriesName);
  const cachePath = path.join(cacheDir, `${safeChapterName}.webp`);

  if (fs.existsSync(cachePath)) {
    console.log(`[Cover API] ✅ CACHÉ HIT: ${cachePath}`);
    return new NextResponse(new Uint8Array(fs.readFileSync(cachePath)), { headers: { 'Content-Type': 'image/webp' } });
  }

  try {
    const seriesPath = path.join(MANGA_ROOT, series);
    if (!fs.existsSync(seriesPath)) {
        console.log(`[Cover API] ❌ RUTA NO EXISTE: ${seriesPath}`);
        return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
    }

    let rawBuffer: Buffer | null = null;

    if (chapter) {
        console.log(`[Cover API] 🔎 Buscando portada para CAPÍTULO...`);
        const baseChapPath = path.join(seriesPath, chapter);
        
        if (fs.existsSync(baseChapPath) && fs.statSync(baseChapPath).isDirectory()) {
             rawBuffer = getFirstImageFromDir(baseChapPath);
        } else if (fs.existsSync(baseChapPath + '.cbz')) {
             rawBuffer = getFirstImageFromZip(baseChapPath + '.cbz');
        } else if (fs.existsSync(baseChapPath + '.zip')) {
             rawBuffer = getFirstImageFromZip(baseChapPath + '.zip');
        } else if (fs.existsSync(baseChapPath) && /\.(cbz|zip)$/i.test(baseChapPath)) {
             rawBuffer = getFirstImageFromZip(baseChapPath);
        } else {
             console.log(`[Cover API] ⚠️ Archivo de capítulo no encontrado o formato desconocido.`);
        }
    } else {
        console.log(`[Cover API] 🔎 Buscando PORTADA PRINCIPAL...`);
        const possibleCovers = ['cover.jpg', 'cover.png', 'cover.webp', 'poster.jpg'];
        for (const pc of possibleCovers) {
            const pcPath = path.join(seriesPath, pc);
            if (fs.existsSync(pcPath)) {
                console.log(`[Cover API] ✅ Archivo oficial encontrado: ${pc}`);
                rawBuffer = fs.readFileSync(pcPath);
                break;
            }
        }

        if (!rawBuffer) {
            console.log(`[Cover API] ⚠️ Sin cover.jpg, explorando contenidos...`);
            const files = fs.readdirSync(seriesPath, { withFileTypes: true }).filter(f => !f.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            for (const f of files) {
                const fullPath = path.join(seriesPath, f.name);
                if (f.isDirectory()) rawBuffer = getFirstImageFromDir(fullPath);
                else if (f.isFile() && /\.(cbz|zip)$/i.test(f.name)) rawBuffer = getFirstImageFromZip(fullPath);
                else if (f.isFile() && /\.(jpg|jpeg|png|webp|avif)$/i.test(f.name)) {
                    console.log(`[Cover API] 🖼️ Imagen suelta encontrada: ${f.name}`);
                    rawBuffer = fs.readFileSync(fullPath);
                }
                if (rawBuffer) break; 
            }
        }
    }

    if (!rawBuffer) {
        console.log(`[Cover API] ❌ FRACASO: No se obtuvo imagen. Placeholder servido.`);
        return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
    }

    console.log(`[Cover API] ⚙️ Procesando imagen con Sharp...`);
    const optimizedBuffer = await sharp(rawBuffer).resize(300, 450, { fit: 'cover', position: 'center' }).webp({ quality: 60 }).toBuffer();

    console.log(`[Cover API] 💾 Guardando en caché...`);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cachePath, optimizedBuffer);

    return new NextResponse(new Uint8Array(optimizedBuffer), { headers: { 'Content-Type': 'image/webp' } });

  } catch (e: any) {
    console.error(`[Cover API] 🔥 ERROR FATAL:`, e.message);
    return NextResponse.redirect(new URL('/placeholder-manga.jpg', request.url));
  }
}