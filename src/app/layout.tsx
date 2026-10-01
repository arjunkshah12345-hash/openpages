import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const body = Geist({
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
    default: "OpenPages — Make room for your next idea",
    template: "%s · OpenPages",
  },
  description:
    "The open-source alternative to OpenAI Pages. Your notes, knowledge, and AI in one workspace — with SuperCompress so context stays focused.",
  applicationName: "OpenPages",
  keywords: [
    "OpenPages",
    "OpenAI Pages",
    "ChatGPT Space",
    "SuperCompress",
    "open source",
    "AI workspace",
    "MCP",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "OpenPages",
    title: "OpenPages — Make room for your next idea",
    description:
      "An open workspace for human thinking. Spaces, living pages, and SuperCompress.",
    images: [{ url: "/og.jpg", width: 1280, height: 720, alt: "OpenPages" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPages — Make room for your next idea",
    description:
      "Open-source OpenAI Pages alternative. SuperCompress inside.",
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
  themeColor: "#fbfbf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(body.variable, mono.variable)}>
      <body className="min-h-full bg-[var(--paper)] font-sans text-[var(--ink)] antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
