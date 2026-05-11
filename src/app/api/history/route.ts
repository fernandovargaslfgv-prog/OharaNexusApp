import { NextResponse } from "next/server";
import { db } from "@/db";
import { history, mangas, users } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";

const TEMP_USER_ID = "admin-nexus";

export async function GET() {
  try {
    const userHistory = await db
      .select({
        id: mangas.id,
        title: mangas.title,
        path: mangas.path,
        chapter: history.lastChapter,
        page: history.lastPage,
        updatedAt: history.updatedAt,
      })
      .from(history)
      .innerJoin(mangas, eq(history.mangaId, mangas.id))
      .where(eq(history.userId, TEMP_USER_ID))
      .orderBy(desc(history.updatedAt))
      .limit(10);

    const formatted = userHistory.map(item => ({
      id: item.id,
      title: item.title,
      path: item.path,
      chapter: item.chapter,
      page: item.page,
      image: `/api/cover?series=${encodeURIComponent(item.path)}`,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, chapter, page } = await req.json();
    const manga = await db.query.mangas.findFirst({
      where: or(eq(mangas.title, title), eq(mangas.path, title))
    });
    
    if (!manga) return NextResponse.json({ error: "Manga no encontrado" }, { status: 404 });

    await db.insert(users).values({ id: TEMP_USER_ID, username: 'admin', passwordHash: 'nopass' }).onConflictDoNothing();

    const now = Math.floor(Date.now() / 1000); // Integer para SQLite
    const existing = await db.query.history.findFirst({
      where: and(eq(history.userId, TEMP_USER_ID), eq(history.mangaId, manga.id))
    });

    if (existing) {
      await db.update(history)
        .set({ lastChapter: chapter, lastPage: page, updatedAt: now })
        .where(eq(history.id, existing.id));
    } else {
      await db.insert(history).values({
        userId: TEMP_USER_ID,
        mangaId: manga.id,
        lastChapter: chapter,
        lastPage: page,
        updatedAt: now
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}