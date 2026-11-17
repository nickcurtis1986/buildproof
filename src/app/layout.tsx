import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Syne } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-syne" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: { default: "BuildProof — see the work before you hire", template: "%s · BuildProof" },
  description: "Watch short videos of real, completed jobs from local contractors. No paid rankings.",
  applicationName: "BuildProof",
  appleWebApp: { capable: true, title: "BuildProof", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#111114",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${instrument.variable}`}>
      <body className="min-h-dvh">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
