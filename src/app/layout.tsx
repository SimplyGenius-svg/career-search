import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Career Search - AI-Powered Career Insights",
  description: "Get personalized insights and guidance for your career journey using AI.",
  // Add more metadata as needed, e.g., icons, viewport, etc.
  // icons: { ... },
  // viewport: { ... },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning is often used with next-themes */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}
