import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TextAreaProvider } from "@/context/TextAreaContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eeon - AI Assistant",
  description:
    "An AI-powered emoji assistant that understands your text and suggests the perfect reactions instantly.emoji",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TextAreaProvider>
          {" "}
          {/* ✅ Wrap App in Context Provider */}
          {children}
        </TextAreaProvider>
      </body>
    </html>
  );
}
