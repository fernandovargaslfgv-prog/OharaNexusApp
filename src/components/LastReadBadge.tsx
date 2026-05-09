"use client";

import { useEffect, useState } from "react";

export default function LastReadBadge({ title, chapter }: { title: string, chapter: string }) {
  const [isLast, setIsLast] = useState(false);

  useEffect(() => {
    // Aplicamos la misma limpieza para buscar el cajón correcto
    const safeTitle = title.trim().toLowerCase();
    const safeChapter = chapter.trim();
    
    // Buscamos en el disco duro local
    const saved = localStorage.getItem(`nexus-last-${safeTitle}`);
    
    if (saved === safeChapter) {
      setIsLast(true);
    }
  }, [title, chapter]);

  if (!isLast) return null;

  return (
    <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse">
      Último leído
    </span>
  );
}