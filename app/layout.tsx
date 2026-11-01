import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dompet Kredit",
  description: "Sistem mikro pinjaman, agunan, dan pemisah kas modal/profit",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // layar iPhone terpakai penuh (notch & home indicator)
  themeColor: "#f2f2f7", // warna status bar Safari, sama dengan background
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}