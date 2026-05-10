import { NextResponse } from "next/server";
import { db } from "@/db";
import { history, mangas, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const TEMP_USER_ID = "admin-nexus";

// --- OBTENER EL HISTORIAL (GET) ---
export async function GET() {
  try {
    // Hacemos un JOIN con la tabla mangas para obtener el título a través del mangaId
    const userHistory = await db
      .select({
        mangaTitle: mangas.title,
        lastChapter: history.lastChapter,
        lastPage: history.lastPage,
      })
      .from(history)
      .innerJoin(mangas, eq(history.mangaId, mangas.id))
      .where(eq(history.userId, TEMP_USER_ID))
      .orderBy(desc(history.updatedAt)); // Ordenamos para que lo último leído salga primero

    return NextResponse.json(userHistory);
  } catch (error) {
    console.error("Error GET history:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// --- GUARDAR PROGRESO (POST) ---
export async function POST(req: Request) {
  try {
    const { title, chapter, page } = await req.json();

    // 1. Buscamos el ID del manga usando su título
    const manga = await db.select().from(mangas).where(eq(mangas.title, title)).get();
    
    if (!manga) {
      return NextResponse.json({ error: "Manga no encontrado en la DB" }, { status: 404 });
    }

    // 2. Aseguramos que el usuario "admin-nexus" exista
    await db.insert(users).values({ 
      id: TEMP_USER_ID, 
      username: 'admin', 
      passwordHash: 'nopass' 
    }).onConflictDoNothing();

    // 3. ¿Ya existe un registro de lectura para este manga y usuario?
    const existing = await db
      .select()
      .from(history)
      .where(and(eq(history.userId, TEMP_USER_ID), eq(history.mangaId, manga.id)))
      .get();

    if (existing) {
      // Si existe, actualizamos el capítulo, la página y el reloj
      await db.update(history)
        .set({ 
          lastChapter: chapter, 
          lastPage: page, 
          updatedAt: sql`(strftime('%s', 'now'))` 
        })
        .where(eq(history.id, existing.id));
    } else {
      // Si es la primera vez que lo lee, creamos el registro
      await db.insert(history).values({
        userId: TEMP_USER_ID,
        mangaId: manga.id,
        lastChapter: chapter,
        lastPage: page,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error POST history:", error);
    return NextResponse.json({ error: "Error al guardar historial" }, { status: 500 });
  }
}