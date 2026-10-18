import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaatify GEO - AI Search Visibility & Citation Intelligence",
  description: "Generative Engine Optimization (GEO) & AI Search Visibility platform by Vaatify.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>

  );
}
