import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';
import sharp from 'sharp';

const MANGA_ROOT = process.env.MANGA_PATH || "/home/luis/mangas/General/mangas";
const CACHE_ROOT = "/app/cover_cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 1. OBTENCIÓN Y DECODIFICACIÓN SEGURA
  const seriesRaw = searchParams.get('series');
  const chapterRaw = searchParams.get('chapter');

  if (!seriesRaw || !chapterRaw) {
    return new NextResponse("Missing params", { status: 400 });
  }

  // Normalizamos a NFC para evitar errores de lectura en sistemas Linux con tildes/eñes
  const series = decodeURIComponent(seriesRaw).normalize("NFC");
  const chapter = decodeURIComponent(chapterRaw).normalize("NFC");

  // Generamos nombres de archivo seguros para la caché
  const safeSeriesName = series.replace(/[/\\?%*:|"<>]/g, '-');
  const safeChapterName = chapter.replace(/[/\\?%*:|"<>]/g, '-');
  
  const cacheDir = path.join(CACHE_ROOT, safeSeriesName);
  const cachePath = path.join(cacheDir, `${safeChapterName}.webp`);

  // 2. VERIFICACIÓN DE CACHÉ (HIT)
  if (fs.existsSync(cachePath)) {
    const cachedImage = fs.readFileSync(cachePath);
    return new NextResponse(new Uint8Array(cachedImage), { 
      headers: { 
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'HIT'
      } 
    });
  }

  try {
    const filePath = path.join(MANGA_ROOT, series, chapter);

    if (!fs.existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${filePath}`);
      return new NextResponse("Manga file not found", { status: 404 });
    }

    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    
    // Filtramos para encontrar la primera imagen real
    const firstImageEntry = entries
      .filter((e: any) => !e.isDirectory && /\.(jpg|jpeg|png|webp|avif)$/i.test(e.entryName))
      .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))[0];

    if (!firstImageEntry) throw new Error("No image found in zip");

    const rawBuffer = zip.readFile(firstImageEntry);
    if (!rawBuffer) throw new Error("Could not read image buffer");

    // 3. PROCESAMIENTO SHARP ULTRA-OPTIMIZADO
    // Redimensionamos a un tamaño fijo de 300x450 para que el CLS sea 0
    const optimizedBuffer = await sharp(rawBuffer)
      .resize(300, 450, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      }) 
      .webp({ 
        quality: 60, // Equilibrio perfecto peso/calidad para móviles
        effort: 4    // Mayor esfuerzo de compresión
      }) 
      .toBuffer();

    // 4. GUARDADO EN CACHÉ (MISS)
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cachePath, optimizedBuffer);

    return new NextResponse(new Uint8Array(optimizedBuffer), { 
      headers: { 
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS'
      } 
    });

  } catch (e) {
    console.error(`Error procesando portada de ${series}:`, e);
    return new NextResponse("Error processing image", { status: 500 });
  }
}