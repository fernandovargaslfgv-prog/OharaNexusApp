import { db } from "@/db"; // Ajusta esta ruta si tu archivo db.ts está en otro sitio
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Validar que nos pasan los datos
    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña obligatorios" },
        { status: 400 }
      );
    }

    // 2. Buscar al usuario en la base de datos
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // 3. Comparar la contraseña enviada con el hash de la base de datos
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // 4. Crear la sesión (Guardamos el ID en una cookie)
    // Nota: Para algo más Pro usaríamos JWT o Lucia, pero esto sirve para empezar
    const cookieStore = await cookies();
    cookieStore.set("nexus_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 semana de duración
      path: "/",
    });

    return NextResponse.json({
      message: "Sesión iniciada",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en la API de Auth:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}