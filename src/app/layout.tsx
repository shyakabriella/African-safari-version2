import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "African Safaris & Hotel Booking Hub",
    template: "%s | African Safaris & Hotel Booking Hub",
  },
  description:
    "Discover unforgettable African safaris, wildlife adventures, "
    + "luxury lodges, and hotel stays across Africa.",
  icons: {
    icon: [
      {
        url: "/images/logo/ICON.PNG",
        type: "image/png",
      },
    ],
    shortcut: "/images/logo/ICON.PNG",
    apple: "/images/logo/ICON.PNG",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
