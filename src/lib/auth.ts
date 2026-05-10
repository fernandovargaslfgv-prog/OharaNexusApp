import { db } from "../db"; // Ajusta la ruta según dónde esté tu archivo de conexión
import { users } from "../db/schema";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

/**
 * Registra un nuevo usuario en la base de datos con la contraseña encriptada.
 */
export async function registerUser(username: string, password: string, role: "admin" | "user" = "user") {
  // Encriptar la contraseña
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    await db.insert(users).values({
      id: nanoid(),
      username: username,
      passwordHash: passwordHash,
      role: role,
    });
    console.log(`✅ Usuario "${username}" creado correctamente.`);
  } catch (error) {
    console.error("❌ Error al crear el usuario:", error);
    throw error;
  }
}