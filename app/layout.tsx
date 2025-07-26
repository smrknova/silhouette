import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter } from "next/font/google"
import { MouseFollower } from "@/components/ui/mouse-follower";

export const metadata: Metadata = {
  title: "Silhouette - Map Your Life",
  description: "Your memories, mapped beautifully with Silhouette",
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          {children}
          <MouseFollower hideOnInteractive={true} />
      </body>
    </html>
  )
}
