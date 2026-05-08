import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG_ENV Console",
  description: "Frontend demo for RAG_ENV"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
