import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munay",
  description: "Explora los destinos turísticos de Lambayeque.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
