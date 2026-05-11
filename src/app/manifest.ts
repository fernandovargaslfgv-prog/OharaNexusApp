import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Ohara Nexus',
    short_name: 'Nexus',
    description: 'Tu biblioteca de manga personal y servidor de lectura',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any', // TS ahora sí lo acepta y Chrome lo valida para instalar
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any', // Requisito mínimo para el botón de instalar
      },
    ],
  }
}