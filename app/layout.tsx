import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIMSGLOW — Luxury Beauty & Cosmetics",
  description:
    "Discover DIMSGLOW's curated luxury cosmetics, radiant skincare essentials, high-performance foundations, and exclusive beauty collections.",
  icons: {
    icon: "/brand/dimsglow-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-white text-[#19161A] antialiased selection:bg-[#FBEAF0] selection:text-[#B83B63]">
        {children}
      </body>
    </html>
  );
}
