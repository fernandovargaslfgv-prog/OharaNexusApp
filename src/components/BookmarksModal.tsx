"use client";

import React from "react";
import Link from "next/link";
import { useBookmarks } from "@/hooks/useBookmarks";

interface BookmarksModalProps {
  onClose: () => void;
}

export default function BookmarksModal({ onClose }: BookmarksModalProps) {
  // Obtenemos las funciones del hook
  const { getAllBookmarks, removeBookmark } = useBookmarks();
  const bookmarks = getAllBookmarks();
  const mangaTitles = Object.keys(bookmarks);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* OVERLAY con efecto blur */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* VENTANA MODAL */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* CABECERA */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase italic text-white tracking-tighter">
              Marcadores
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Tu historial de lectura
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-white">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* LISTADO DE MARCADORES */}
        <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-hide">
          {mangaTitles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.3em]">
                No hay capítulos guardados
              </p>
            </div>
          ) : (
            mangaTitles.map((title) => (
              <div key={title} className="mb-8 last:mb-0">
                <h3 className="text-[10px] font-black text-red-500 uppercase mb-3 tracking-[0.2em] px-2">
                  {title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(bookmarks[title]).map((chapter) => (
                    <div 
                      key={chapter} 
                      className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 hover:border-white/20 transition-all group/item"
                    >
                      <Link 
                        href={`/manga/${encodeURIComponent(title)}/${encodeURIComponent(chapter)}`}
                        onClick={onClose}
                        className="text-xs font-bold text-zinc-300 hover:text-white"
                      >
                        {chapter.replace('.cbz', '').replace('.zip', '')}
                        <span className="ml-2 text-zinc-600 font-medium text-[10px]">
                          Pág. {bookmarks[title][chapter]}
                        </span>
                      </Link>
                      
                      {/* BOTÓN DE ELIMINAR CAPÍTULO */}
                      <button 
                        onClick={() => removeBookmark(title, chapter)} 
                        className="text-zinc-700 hover:text-red-500 transition-colors"
                        title="Eliminar marcador"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}