import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ohara Nexus",
  description: "Disfruta de tus mangas favoritos en Ohara Nexus",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ohara Nexus",
  },
};

// AJUSTE CRÍTICO PARA EL WEBVIEW DE ANDROID
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5, // Evita zoom accidental al tocar botones
  userScalable: true, // En una APK es mejor desactivarlo para que se sienta nativa
  viewportFit: "cover", // Usa toda la pantalla (notch incluido)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: "black" }} // Evita parpadeo blanco al cargar
    >
      <body className="min-h-full flex flex-col bg-black overflow-x-hidden">
        {children}
        
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "bg-zinc-900 border border-white/10 text-white",
              title: "text-sm font-semibold",
              description: "text-xs text-zinc-400",
            },
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('Nexus SW registrado con éxito:', reg.scope);
                  }, function(err) {
                    console.log('Fallo al registrar el SW:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}