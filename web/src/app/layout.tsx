import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pandem | Private SaaS Subscriptions on NEAR",
  description: "Native NEAR subscription escrow with verifiable agent health checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
