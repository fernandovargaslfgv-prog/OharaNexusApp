import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- TABLAS DE AUTENTICACIÓN ---

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), 
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user").notNull(), 
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

// --- TABLAS DE CONTENIDO ---

export const libraries = sqliteTable("libraries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  path: text("path").notNull().unique(), 
});

export const mangas = sqliteTable("mangas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  libraryId: integer("library_id")
    .references(() => libraries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  path: text("path").notNull().unique(),
  cover: text("cover"), // Portada local extraída del archivo
  
  // Metadatos extendidos (Sincronizados con AniList)
  anilistId: integer("anilist_id"),      // ID único de AniList
  bannerImage: text("banner_image"),    // Arte horizontal para el Hero
  coverImage: text("cover_image"),      // Portada oficial en alta resolución
  author: text("author").default("Autor desconocido"),
  artist: text("artist"),
  description: text("description"),     // Sinopsis oficial
  genres: text("genres"),               // "Acción, Aventura, Seinen"
  status: text("status").default("Desconocido"), 
  year: integer("year"),
  type: text("type").default("Manga"), 
  
  lastScan: integer("last_scan"), 
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// NUEVA: Para guardar la info de cada archivo dentro del manga
export const chapters = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mangaId: integer("manga_id")
    .notNull()
    .references(() => mangas.id, { onDelete: "cascade" }),
  number: text("number").notNull(), 
  title: text("title"), 
  path: text("path").notNull(), 
  cover: text("cover"), 
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now'))`),
});

// --- TABLAS RELACIONADAS CON EL USUARIO ---

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mangaId: integer("manga_id")
    .notNull()
    .references(() => mangas.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now'))`),
});

export const history = sqliteTable("history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mangaId: integer("manga_id")
    .notNull()
    .references(() => mangas.id, { onDelete: "cascade" }),
  lastChapter: text("last_chapter").notNull(), 
  lastPage: integer("last_page").default(0),
  updatedAt: integer("updated_at").default(sql`(strftime('%s', 'now'))`),
});

// --- TABLA DE CONFIGURACIÓN ---

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(), 
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});