import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangas } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return new NextResponse("Falta ID", { status: 400 });

  const manga = await db.query.mangas.findFirst({
    where: eq(mangas.id, parseInt(id)),
  });

  if (!manga || !manga.cover) {
    return new NextResponse(null, { status: 404 });
  }

  // Extraemos el tipo de contenido y el buffer del Base64
  const base64Data = manga.cover.split(",")[1];
  const contentType = manga.cover.split(":")[1].split(";")[0];
  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}