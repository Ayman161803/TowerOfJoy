import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TowerOfJoy | LDR Planner",
  description: "A couple planner for shared goals, date planning, and memory keeping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${newsreader.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
