import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "רשימת אורחים אדירים",
  description: "כלי ניהול מבקרים שבועי, צ'פטר BNI אדירים",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Sans (OFL), עברית + לטינית, ציר משקל משתנה 400..700 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
