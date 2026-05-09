import { db } from "./src/db"; // Asegúrate de que la ruta a tu archivo de DB sea correcta
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Sincronizando usuario de prueba...");

  const existingUser = await db.select().from(users).where(eq(users.id, "admin-nexus"));

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: "admin-nexus",
      username: "admin",
      passwordHash: "no_password_yet", // No importa por ahora
      role: "admin",
    });
    console.log("✅ Usuario 'admin-nexus' creado para desarrollo.");
  } else {
    console.log("ℹ️ El usuario ya existe, saltando...");
  }
  
  process.exit(0);
}

main();