"use client";

import { useBookmarks } from "@/hooks/useBookmarks";

interface FavoriteButtonProps {
  title: string;
  cover: string;
}

export default function FavoriteButton({ title, cover }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useBookmarks();
  const fav = isFavorite(title);

  return (
    <button 
      onClick={() => toggleFavorite({ title, cover })}
      className={`bg-white text-black text-[10px] font-black uppercase px-10 py-3.5 rounded-sm transition-all tracking-[0.2em] shadow-xl ${
        fav ? 'bg-red-600 text-white shadow-red-600/20' : 'hover:bg-red-600 hover:text-white'
      }`}
    >
      {fav ? 'En Favoritos' : 'Añadir a Favoritos'}
    </button>
  );
}