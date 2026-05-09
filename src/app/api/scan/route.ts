import { NextResponse } from "next/server";
import { scanLibrary } from "@/lib/indexer"; // Ajusta la ruta si no usas el alias @

export async function POST(request: Request) {
  try {
    const { libraryId } = await request.json();

    // 1. Validación básica
    if (!libraryId) {
      return NextResponse.json(
        { error: "ID de librería no proporcionado" },
        { status: 400 }
      );
    }

    // 2. Ejecutar el escaneo Pro (recursivo y multiformato)
    // Pasamos el ID convertido a número por si acaso llega como string
    await scanLibrary(Number(libraryId));

    return NextResponse.json({ 
      message: "Escaneo completado con éxito",
      status: "success" 
    });

  } catch (error: any) {
    console.error("Error en la ruta de escaneo:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}