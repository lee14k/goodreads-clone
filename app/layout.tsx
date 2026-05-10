import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Nav } from "@/components/Nav";
import { isLoggedIn } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Bookshelf",
  description: "A personal reading tracker.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const showNav = await isLoggedIn();
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        {showNav && <Nav />}
        {children}
      </body>
    </html>
  );
}
