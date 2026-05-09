import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MANGAS_PATH = process.env.MANGA_PATH || '/home/luis/mangas/General/mangas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesParam = searchParams.get('series') || '';
    
    // 1. Limpieza extrema del parámetro que viene del navegador
    const decodedSeries = decodeURIComponent(seriesParam).trim();

    // 2. Leemos todas las carpetas que Docker SÍ ve
    const folders = fs.readdirSync(MANGAS_PATH);

    // 3. Buscamos la carpeta real comparando de forma flexible
    const actualFolderName = folders.find(f => {
      const fClean = f.trim().toLowerCase();
      const pClean = decodedSeries.toLowerCase();
      // Retorna verdadero si son iguales o si una contiene a la otra
      return fClean === pClean || fClean.includes(pClean) || pClean.includes(fClean);
    });

    if (!actualFolderName) {
      console.log(`[API] No se encontró carpeta para: "${decodedSeries}"`);
      return NextResponse.json([]);
    }

    const seriesPath = path.join(MANGAS_PATH, actualFolderName);
    
    // 4. Leemos los archivos (usando el nombre real de la carpeta que sí existe)
    const files = fs.readdirSync(seriesPath)
      .filter(f => f.toLowerCase().endsWith('.cbz'))
      .map(file => ({
        id: file,
        title: file.replace(/\.cbz$/i, ''),
        fileName: file
      }));

    // Ordenamos numéricamente por el #001, #002...
    files.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error crítico en manga-page:", error);
    return NextResponse.json([]);
  }
}