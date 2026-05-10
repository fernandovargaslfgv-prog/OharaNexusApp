import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, mangas, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// NOTA: Como aún no hemos activado el Login, usaremos un "ID temporal"
// Mañana cuando pongamos Auth, esto vendrá de la sesión.
const TEMP_USER_ID = "admin-nexus";

export async function GET() {
  try {
    const userFavs = await db
      .select({
        mangaTitle: mangas.title,
      })
      .from(favorites)
      .innerJoin(mangas, eq(favorites.mangaId, mangas.id))
      .where(eq(favorites.userId, TEMP_USER_ID));

    return NextResponse.json(userFavs.map(f => f.mangaTitle));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    // 1. Buscamos el ID del manga por su título
    const manga = await db.select().from(mangas).where(eq(mangas.title, title)).get();
    
    if (!manga) return NextResponse.json({ error: "Manga no encontrado en DB" }, { status: 404 });

    // 2. ¿Ya es favorito?
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, TEMP_USER_ID),
          eq(favorites.mangaId, manga.id)
        )
      )
      .get();

    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return NextResponse.json({ status: "removed" });
    } else {
      // Nos aseguramos de que el usuario exista (por el FK constraint)
      await db.insert(users).values({ id: TEMP_USER_ID, username: 'admin', passwordHash: 'nopass' }).onConflictDoNothing();
      
      await db.insert(favorites).values({
        userId: TEMP_USER_ID,
        mangaId: manga.id,
      });
      return NextResponse.json({ status: "added" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}