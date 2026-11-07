import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "帧刻 Framecut · 让精彩，循环发生",
  description: "逐帧裁切、实时预览、自定义尺寸。轻松将视频转换成 GIF、动态 WebP 和 APNG，文件仅在本地处理。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
