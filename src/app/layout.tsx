import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { listMeetingSummaries } from "@/lib/meetings";
import { AppChrome } from "@/components/layout/AppChrome";
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
  title: "Fathom Rebuild",
  description: "AI meeting notetaker — take-home rebuild",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const meetings = await listMeetingSummaries();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppChrome meetings={meetings}>{children}</AppChrome>
      </body>
    </html>
  );
}
