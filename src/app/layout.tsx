import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import { AppShell } from "./components/AppShell";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getRequestLocale } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const isSpanish = locale === "es";
  return {
    title: `lozana — ${isSpanish ? "bitácora de piel" : "skin journal"}`,
    description: isSpanish
      ? "Rutina, alimentación, ejercicio y seguimiento de piel."
      : "Skin care routine, food, exercise, and progress tracking.",
    icons: {
      icon: [
        { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

// Fraunces e Inter son variable fonts: se omite `weight` para cargar el rango completo.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      {/* Las extensiones del navegador escriben atributos en el body antes de
          que React hidrate (ColorZilla pone cz-shortcut-listen, por ejemplo).
          Solo afecta a este elemento, no a su contenido: un desajuste real
          dentro del árbol se sigue reportando. */}
      <body className="min-h-full" suppressHydrationWarning>
        <I18nProvider locale={locale}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
