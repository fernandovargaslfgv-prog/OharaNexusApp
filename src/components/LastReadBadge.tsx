"use client";

import { useEffect, useState } from "react";

interface LastReadBadgeProps {
  title: string;   // El path o título del manga
  chapter: string; // El archivo .cbz actual en la lista
}

export default function LastReadBadge({ title, chapter }: LastReadBadgeProps) {
  const [isLastRead, setIsLastRead] = useState(false);

  useEffect(() => {
    const checkHistory = async () => {
      try {
        const res = await fetch("/api/history");
        const historyData = await res.json();
        
        // Buscamos si este manga tiene un registro y si el capítulo coincide
        const record = historyData.find((item: any) => 
          (item.path === title || item.title === title) && item.chapter === chapter
        );

        if (record) {
          setIsLastRead(true);
        } else {
          setIsLastRead(false);
        }
      } catch (e) {
        console.error("Error en el badge de historial");
      }
    };

    checkHistory();
    
    // Escuchamos cuando la pestaña vuelve a tener foco (por si regresas de leer)
    window.addEventListener('focus', checkHistory);
    return () => window.removeEventListener('focus', checkHistory);
  }, [title, chapter]);

  if (!isLastRead) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 px-2 py-1 rounded-md mb-1 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
      </span>
      <span className="text-[10px] font-black uppercase text-red-500 italic tracking-tighter">
        Último leído
      </span>
    </div>
  );
}