import type { Metadata } from "next";
import "./globals.css";
import { NearWalletProvider } from "../context/NearWalletContext";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Pandem | Decentralized SaaS Subscription Escrow on NEAR",
  description:
    "Native NEAR subscription escrow with periodic heartbeat liveness verification, split payouts, and automated non-custodial refunds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black text-zinc-100">
      <body className="antialiased min-h-screen flex flex-col bg-black text-zinc-100 selection:bg-emerald-500 selection:text-black">
        <NearWalletProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                Pandem Protocol · Built for NEAR Hackathon (Real-World Money & Privacy Tracks)
              </div>
              <div className="flex items-center gap-4 text-zinc-400">
                <a
                  href="https://explorer.testnet.near.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  NEAR Testnet Explorer
                </a>
                <span>·</span>
                <a
                  href="https://cloud.near.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  NEAR AI Cloud TEE
                </a>
              </div>
            </div>
          </footer>
        </NearWalletProvider>
      </body>
    </html>
  );
}
