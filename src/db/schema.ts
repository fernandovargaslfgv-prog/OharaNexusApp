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
  title: text("title").notNull(), // Título de la carpeta o del XML
  path: text("path").notNull().unique(),
  cover: text("cover"),
  
  // Metadatos extendidos (Manga Plus Style)
  author: text("author").default("Autor desconocido"),
  artist: text("artist"),
  description: text("description"), // Sinopsis / Argumento
  genres: text("genres"), // Guardaremos "Acción, Aventura, Seinen"
  status: text("status").default("Desconocido"), // Ej: Ongoing, Completed
  year: integer("year"),
  type: text("type").default("Manga"), // Manga, Manhwa, Comic
  
  lastScan: integer("last_scan"), 
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// NUEVA: Para guardar la info de cada archivo dentro del manga
export const chapters = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mangaId: integer("manga_id")
    .notNull()
    .references(() => mangas.id, { onDelete: "cascade" }),
  number: text("number").notNull(), // El número del cap (ej: "1", "10.5")
  title: text("title"), // El nombre del capítulo (ej: "Aquel día") extraído del XML
  path: text("path").notNull(), // Ruta al archivo .cbz / .zip
  cover: text("cover"), // Miniatura opcional del capítulo
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
  lastChapter: text("last_chapter").notNull(), // Guardamos el número o el ID del capítulo
  lastPage: integer("last_page").default(0),
  updatedAt: integer("updated_at").default(sql`(strftime('%s', 'now'))`),
});

// --- TABLA DE CONFIGURACIÓN ---

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(), 
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});