import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FTP Manager Pro",
  description: "Modern FTP Manager for Resellers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
