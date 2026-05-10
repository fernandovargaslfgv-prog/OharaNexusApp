import { db } from "./db"; // Corregido: ya estamos dentro de /src
import { users } from "./db/schema"; // Corregido: ya estamos dentro de /src
import { eq } from "drizzle-orm";

// Función de ejemplo para inicializar datos si fuera necesario
export async function seed() {
  console.log("🌱 Iniciando siembra de base de datos...");
  // Aquí puedes añadir lógica para crear un usuario administrador inicial
  console.log("✅ Siembra completada.");
}