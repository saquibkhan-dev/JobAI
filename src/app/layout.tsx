import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JobAI — AI-Powered Job Application Platform",
    template: "%s | JobAI",
  },
  description:
    "Parse your resume, get an ATS score, generate tailored cover letters, and track every application in one place.",
  openGraph: {
    title: "JobAI — AI-Powered Job Application Platform",
    description: "Land your next role faster with AI-assisted resume review and application tracking.",
    url: SITE_URL,
    siteName: "JobAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobAI — AI-Powered Job Application Platform",
    description: "AI resume review, ATS scoring, and job application tracking.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
