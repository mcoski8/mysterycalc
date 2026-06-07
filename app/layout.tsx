// ============================================================
// Root layout — the HTML shell wrapped around every page.
//
// Plain English: this sets up the fonts, the page <head> (title, social-
// share tags, theme color), a "skip to content" link for keyboard/screen-
// reader users, and the app-wide footer with the legal disclaimer. Each
// page's own content is dropped in where {children} sits.
// ============================================================

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

// Body text — Geist (clean, neutral, great at small sizes).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Numbers and monospaced bits.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display font — Space Grotesk gives the wordmark and section headings a
// distinctive, slightly technical character that pairs with Geist's neutrality.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// The public URL the site lives at, used to turn relative social-share image
// paths into absolute ones. On Vercel this is provided automatically; locally
// it falls back to localhost. GOTCHA: if a custom domain is added later, set
// NEXT_PUBLIC_SITE_URL in the Vercel project to override this.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const TITLE = `${APP_NAME} — ${APP_TAGLINE}`;
const DESCRIPTION =
  "A free tool for vendors to design and price mystery games — oripa, walls of sleeves, prize wheels, kuji, razzes. Solve for price, chances, or margin and see true profit and game feel.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: {
    default: TITLE,
    // Sub-pages can set their own title; it gets "· MysteryCalc" appended.
    template: `%s · ${APP_NAME}`,
  },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // Tint the mobile browser chrome to match each theme's page background.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#16161f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // next-themes sets class="dark" on <html> before paint; the server can't
      // know the saved theme, so we suppress the expected one-attribute mismatch.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Decorative aurora glow behind everything (no-print, non-interactive). */}
          <div className="aurora no-print" aria-hidden="true" />
          {/* Skip link: invisible until a keyboard user tabs to it, then it
              appears and jumps focus past the header straight to the content. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
