import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- TABLAS DE AUTENTICACIÓN ---

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Usaremos IDs tipo nanoid/uuid para mayor seguridad
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user").notNull(), // 'admin' o 'user'
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
  title: text("title").notNull(),
  path: text("path").notNull().unique(),
  author: text("author").default("Nexus Library"),
  cover: text("cover"),
  lastScan: integer("last_scan"),
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