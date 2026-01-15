import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Montserrat,
  Overpass_Mono,
  Poppins,
  Roboto
} from "next/font/google";
import "./globals.css";
import TanStackQueryProvider from "@/TanStackQuery.Providers";
import { LoadingProvider } from "@/components/global/Loader/Loader-Context";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto"
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-montserrat"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins"
});

const overpass_mono = Overpass_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-overpass-mono"
});

export const metadata: Metadata = {
  title: "CRM & Workflow System",
  description: "Customer Relationship Management and Workflow Automation System for hardware product delivery"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={"en"} suppressHydrationWarning>
      <body
        // className={`${inter.className} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${poppins.variable} ${overpass_mono.variable}`}>
        className={`${inter.className} ${inter.variable}`}>
        <TanStackQueryProvider>
          <LoadingProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" />
          </LoadingProvider>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
