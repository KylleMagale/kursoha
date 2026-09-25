import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { LenisProvider } from "@/components/lenis-provider";
import ClickSpark from "@/components/click-spark";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <LenisProvider>
          <ClickSpark>{children}</ClickSpark>
        </LenisProvider>
      </body>
    </html>
  )
}