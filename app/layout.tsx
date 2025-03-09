import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "任务 DAG 可视化与聊天工具",
  description: "使用Vercel AI SDK生成和可视化任务DAG（有向无环图）并提供智能聊天功能",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen overflow-hidden`}>
        <div className="flex flex-col h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
