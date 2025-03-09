import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 使用Inter字体，包含更多字符集以支持中文
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

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
    <html lang="zh-CN" className={inter.variable}>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen overflow-hidden antialiased`}>
        <div className="flex flex-col h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          {children}
        </div>
      </body>
    </html>
  );
}
