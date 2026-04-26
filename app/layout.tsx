import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import PWARegistration from "@/components/PWARegistration"
import { Viewport } from "next"

const inter = Inter({ subsets: ["latin"] })
export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full w-full overscroll-none">
      <head>
        <title>ExponenTile</title>
        <meta name="description" content="A match 3 game mixed with 2048." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="ExponenTile" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="ExponenTile" />
        <meta
          name="theme-color"
          content="#020617"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body
        className={`${inter.className} h-full w-full overscroll-none bg-slate-50 dark:bg-slate-950`}
      >
        {children}
        <PWARegistration />
        <Toaster />
      </body>
    </html>
  )
}
