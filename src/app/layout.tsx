import type { Metadata, Viewport } from "next";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";
import { PixelBackground } from "@/components/PixelBackground";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileShell } from "@/components/MobileShell";
import { ConnectModals } from "@/components/ConnectModals";
import { siteConfig } from "@/lib/config";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Minecraft`,
    template: `%s · ${siteConfig.name}`,
  },
  description: `Servidor Minecraft Java (${siteConfig.java.host}) y Bedrock (${siteConfig.bedrock.host}:${siteConfig.bedrock.port}).`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={pixelify.className}>
        <PixelBackground />
        <div className="site">
          <Nav />
          {children}
          <Footer />
        </div>
        <MobileShell />
        <ConnectModals />
      </body>
    </html>
  );
}
