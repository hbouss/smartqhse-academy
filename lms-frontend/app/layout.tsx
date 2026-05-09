import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Analytics } from "@vercel/analytics/react";

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

        <Analytics />

        <Script id="linkedin-insight-init" strategy="afterInteractive">
          {`
            _linkedin_partner_id = "9120474";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          `}
        </Script>

        <Script id="linkedin-insight-loader" strategy="afterInteractive">
          {`
            (function(l) {
              if (!l) {
                window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q = [];
              }
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";
              b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://px.ads.linkedin.com/collect/?pid=9120474&fmt=gif"
          />
        </noscript>
      </body>
    </html>
  );
}