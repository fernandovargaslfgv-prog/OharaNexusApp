import { NextRequest, NextResponse } from "next/server";
import path from "path";
// @ts-ignore
import AdmZip from "adm-zip";

const MANGA_ROOT = process.env.MANGA_PATH || "/app/mangas_data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series");
  const chapter = searchParams.get("chapter");
  const page = searchParams.get("page");

  if (!series || !chapter || !page) return new NextResponse("Faltan parámetros", { status: 400 });

  try {
    const chapterPath = path.join(MANGA_ROOT, series, chapter);
    const zip = new AdmZip(chapterPath);
    const entry = zip.getEntry(page);

    if (!entry) return new NextResponse("Página no encontrada", { status: 404 });

    const buffer = entry.getData();
    
    const ext = path.extname(page).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    // CORRECCIÓN: Envolvemos el buffer en Uint8Array para que TypeScript sea feliz
    return new NextResponse(new Uint8Array(buffer), {
      headers: { 
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable" 
      }
    });
  } catch (err) {
    console.error("🔥 Error render-page:", err);
    return new NextResponse("Error extrayendo imagen", { status: 500 });
  }
}