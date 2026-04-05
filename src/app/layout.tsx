import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import ClientProviders from "@/components/ClientProviders";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "600", "700", "900"],
});

const fontBody = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "성경 365 - Divine Light",
  description: "Premium Bible Reading Experience",
  manifest: "/BR/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "성경 365",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/BR/favicon.ico",
    apple: "/BR/logo-final.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a", // Match manifest background
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="antialiased">
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans text-foreground selection:bg-primary/20",
          fontDisplay.variable,
          fontBody.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProviders>
            {children}
            <PWAInstallPrompt />
          </ClientProviders>
        </ThemeProvider>
        <PWAInstallBanner />
      </body>
    </html>
  );
}
