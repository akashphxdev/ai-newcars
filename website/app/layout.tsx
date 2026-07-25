
// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import DevLoadTimeBadge from "@/components/common/DevLoadTimeBadge";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TimesAuto",
  description: "India's most trusted auto portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {/* w-full is required here: body is a column flex container, and a
            page's own top-level element (unless it happens to be wrapped in
            something like the homepage's min-h-screen div) doesn't reliably
            stretch to full width as a direct flex item — it was collapsing
            to a much narrower auto/content-based width instead. This one
            fix applies to every page, current and future. */}
        <main className="w-full flex-1">{children}</main>
        <Footer />
        <DevLoadTimeBadge />
      </body>
    </html>
  );
}