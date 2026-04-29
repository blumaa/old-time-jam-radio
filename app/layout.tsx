import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "The Old-Time Dial",
  description: "A practice tool for old-time musicians",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OT Dial",
  },
};

export const viewport: Viewport = {
  themeColor: "#3c2415",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
          <ServiceWorkerRegistrar />
          {children}
        </body>
    </html>
  );
}
