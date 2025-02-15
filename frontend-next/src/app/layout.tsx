import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pixelsFont = localFont({
  src: [
    {
      path: "../../public/fonts/PublicPixel-z84yD.ttf",
      weight: "400",
    },
  ],
  variable: "--font-pixels"
});

export const metadata: Metadata = {
  title: "art/peace",
  description: "Competitive art experiment on Starknet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pixelsFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
