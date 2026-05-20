import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Mobile Perum BULOG",
  description: "Sistem Presensi Digital Mobile - Perum BULOG Kantor Wilayah Kalimantan Selatan",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-zinc-100 dark:bg-zinc-900 flex justify-center items-stretch text-zinc-900 dark:text-zinc-100 font-sans">
        <main className="w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl min-h-screen flex flex-col relative border-x border-zinc-100 dark:border-zinc-900 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

