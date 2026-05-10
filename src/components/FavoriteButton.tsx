"use client";

import { useState, useEffect } from "react";

// 1. Le decimos a TypeScript que este botón puede recibir un title y un cover
interface FavoriteButtonProps {
  title: string;
  cover?: string; // Lo ponemos opcional con "?" por si algún manga no tiene portada
}

export default function FavoriteButton({ title, cover }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar estado inicial desde el Servidor
  useEffect(() => {
    fetch("/api/favorites")
      .then(res => res.json())
      .then(favs => {
        setIsFav(favs.includes(title));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [title]);

  const toggleFavorite = async () => {
    setIsFav(!isFav); // Optimistic update
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      if (!res.ok) setIsFav(isFav); // Revertir si falla
    } catch (e) {
      setIsFav(isFav);
    }
  };

  if (loading) return <div className="w-8 h-8 animate-pulse bg-white/5 rounded-full" />;

  return (
    <button 
      onClick={toggleFavorite}
      className={`group flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all
        ${isFav ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
    >
      <span className="text-sm">{isFav ? "❤️" : "🤍"}</span>
      {isFav ? "En Biblioteca" : "Añadir a Favoritos"}
    </button>
  );
}