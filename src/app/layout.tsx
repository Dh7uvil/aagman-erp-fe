import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";

import { APP_NAME } from "@/config/constants";
import { QueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/components/layout/theme-provider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { THEME_BOOTSTRAP_SCRIPT } from "@/shared/lib/theme";
import { Toaster } from "@/shared/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_NAME,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} min-h-svh antialiased`}
    >
      <body className="min-h-svh font-sans">
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
