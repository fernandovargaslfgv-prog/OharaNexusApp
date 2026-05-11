import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchAnilistMetadata } from "@/lib/anilist";

export async function POST(req: Request) {
  try {
    const { mangaId } = await req.json();

    // 1. Buscamos el manga en nuestra DB local
    const manga = await db.query.mangas.findFirst({
      where: eq(mangas.id, mangaId)
    });

    if (!manga) return NextResponse.json({ error: "Manga no encontrado" }, { status: 404 });

    // 2. Buscamos en AniList usando el título o el nombre de la carpeta
    console.log(`🔍 Buscando metadatos para: ${manga.title}`);
    const meta = await fetchAnilistMetadata(manga.title);

    if (meta) {
      // 3. Actualizamos nuestra DB con la info real
      await db.update(mangas)
        .set({
          description: meta.description,
          status: meta.status,
          genres: JSON.stringify(meta.genres),
          bannerImage: meta.bannerImage,
          coverImage: meta.coverImage?.extraLarge || meta.coverImage?.large,
          anilistId: meta.id,
          // Si el título era el nombre de la carpeta feo, lo actualizamos al oficial
          title: meta.title.romaji || meta.title.english || manga.title 
        })
        .where(eq(mangas.id, manga.id));

      return NextResponse.json({ success: true, metadata: meta });
    }

    return NextResponse.json({ error: "No se encontraron metadatos" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}