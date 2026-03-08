import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JM Consulting",
  description: "Sistema de gestión de consultoría para restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
