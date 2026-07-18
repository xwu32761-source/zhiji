import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知己 — 一本关于自己的说明书",
  description: "记录即疗愈。AI 帮你发现你自己都忽略的生存模式。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
