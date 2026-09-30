import type { Metadata, Viewport } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://openpages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OpenPages — Workspace for humans and agents",
    template: "%s · OpenPages",
  },
  description:
    "Open-source AI workspace with persistent Spaces, collaborative pages, and SuperCompress-powered inference. Persistent context without persistent token costs.",
  applicationName: "OpenPages",
  keywords: [
    "OpenPages",
    "SuperCompress",
    "AI workspace",
    "agents",
    "MCP",
    "context compression",
    "open source",
  ],
  authors: [{ name: "OpenPages" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "OpenPages",
    title: "OpenPages — Workspace for humans and agents",
    description:
      "Persistent Spaces for humans and agents. SuperCompress keeps your context window from growing with your workspace.",
    images: [
      {
        url: "/og.jpg",
        width: 1280,
        height: 720,
        alt: "OpenPages — workspace for humans and agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPages — Workspace for humans and agents",
    description:
      "Open-source AI workspace powered by SuperCompress. Persistent context without persistent token costs.",
    images: ["/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbfbf8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
