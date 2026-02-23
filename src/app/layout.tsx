import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Reference Calibration",
  description: "Calibrate the meaning of common meeting words as a group.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
