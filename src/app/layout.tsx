import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noded — Skyblock Ironman Progression",
  description:
    "Ironman progression planner with craft trees, shopping lists, and goal tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full overflow-hidden`}>
      <body className="h-full overflow-hidden font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
