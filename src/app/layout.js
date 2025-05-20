import "@/styles/print.css";
import Script from "next/script";
import "./fonts.css";
import "./globals.css";

export const metadata = {
  title: "Restaurant POS System",
  description: "A Next.js 14 powered restaurant management POS system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>{/* External stylesheets are imported in the globals.css file using @import */}</head>
      <body>
        {children}
        <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
