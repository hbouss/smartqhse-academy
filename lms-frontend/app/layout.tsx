import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartQHSE Academy",
    template: "%s | SmartQHSE Academy",
  },
  description:
    "SmartQHSE Academy est la plateforme premium de formation QHSE, IA et automatisation pour structurer les usages, piloter les audits, les actions et la conformité.",
  keywords: [
    "QHSE",
    "formation QHSE",
    "IA QHSE",
    "automatisation QHSE",
    "audit interne QHSE",
    "pilotage actions QHSE",
    "formation IA",
    "SmartQHSE Academy",
  ],
  applicationName: "SmartQHSE Academy",
  authors: [{ name: "SmartQHSE Academy" }],
  creator: "SmartQHSE Academy",
  publisher: "SmartQHSE Academy",
  metadataBase: new URL("https://www.smartqhse-academy.com"),
  openGraph: {
    title: "SmartQHSE Academy",
    description:
      "Plateforme premium de formation QHSE, IA et automatisation pour comprendre, structurer et piloter la performance QHSE de manière moderne.",
    url: "https://www.smartqhse-academy.com",
    siteName: "SmartQHSE Academy",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-smartqhse-academy.png",
        width: 1200,
        height: 630,
        alt: "SmartQHSE Academy - Plateforme premium de formation QHSE, IA et automatisation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartQHSE Academy",
    description:
      "Plateforme premium de formation QHSE, IA et automatisation.",
    images: ["/og-smartqhse-academy.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}