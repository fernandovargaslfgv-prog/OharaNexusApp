"use client";

import { useState, useEffect, useCallback } from 'react';

export interface BookmarkData {
  [mangaTitle: string]: {
    [chapter: string]: number;
  };
}

export interface FavoriteManga {
  title: string;
  cover: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkData>({});
  const [favorites, setFavorites] = useState<FavoriteManga[]>([]);

  // Función para cargar datos desde localStorage
  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const storedBookmarks = localStorage.getItem('manga-bookmarks');
    if (storedBookmarks) {
      try { 
        setBookmarks(JSON.parse(storedBookmarks)); 
      } catch (e) { 
        console.error("Error cargando marcadores:", e); 
      }
    }

    const storedFavs = localStorage.getItem('manga-favorites');
    if (storedFavs) {
      try { 
        setFavorites(JSON.parse(storedFavs)); 
      } catch (e) { 
        console.error("Error cargando favoritos:", e); 
      }
    }
  }, []);

  // Escuchar cambios en el storage (para sincronizar entre pestañas o componentes)
  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [loadData]);

  // GUARDAR UN MARCADOR
  const saveBookmark = useCallback((mangaTitle: string, chapter: string, page: number) => {
    setBookmarks(prev => {
      if (prev[mangaTitle]?.[chapter] === page) return prev;
      const newState = {
        ...prev,
        [mangaTitle]: { ...prev[mangaTitle], [chapter]: page }
      };
      localStorage.setItem('manga-bookmarks', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // ELIMINAR UN MARCADOR (Esta es la que faltaba para el Build)
  const removeBookmark = useCallback((mangaTitle: string, chapter: string) => {
    setBookmarks(prev => {
      const newState = { ...prev };
      if (newState[mangaTitle]) {
        // Borramos el capítulo específico
        delete newState[mangaTitle][chapter];
        
        // Si el manga ya no tiene capítulos guardados, borramos el título
        if (Object.keys(newState[mangaTitle]).length === 0) {
          delete newState[mangaTitle];
        }
        
        localStorage.setItem('manga-bookmarks', JSON.stringify(newState));
      }
      return newState;
    });
  }, []);

  // OBTENER PÁGINA DE UN MARCADOR
  const getBookmark = useCallback((mangaTitle: string, chapter: string): number | null => {
    return bookmarks[mangaTitle]?.[chapter] ?? null;
  }, [bookmarks]);

  // GESTIONAR FAVORITOS
  const toggleFavorite = useCallback((manga: FavoriteManga) => {
    const stored = localStorage.getItem('manga-favorites');
    let currentFavs: FavoriteManga[] = stored ? JSON.parse(stored) : [];
    
    const isAlreadyFav = currentFavs.some(f => f.title === manga.title);
    const nextState = isAlreadyFav
      ? currentFavs.filter(f => f.title !== manga.title)
      : [...currentFavs, manga];
    
    localStorage.setItem('manga-favorites', JSON.stringify(nextState));
    setFavorites(nextState);
    
    // Notificar a otros componentes
    window.dispatchEvent(new Event('storage'));
  }, []);

  const isFavorite = useCallback((title: string) => {
    return favorites.some(f => f.title === title);
  }, [favorites]);

  return { 
    saveBookmark, 
    getBookmark, 
    removeBookmark, // <--- Exportada correctamente
    toggleFavorite, 
    isFavorite, 
    favorites, 
    getAllBookmarks: () => bookmarks 
  };
};