import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NearWalletProvider } from "../context/NearWalletContext";
import { Navbar } from "../components/Navbar";
import { ExtensionErrorGuard } from "../components/ExtensionErrorGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pandem | Sovereign SaaS & AI Launchpad on NEAR",
  description:
    "The sovereign launchpad for confidential SaaS and autonomous AI agents on NEAR. Deploy hardware-isolated enclaves, invisible subscription payments, and self-funding smart contracts.",
};

const EARLY_EXTENSION_FILTER = `
(function() {
  if (typeof window === 'undefined') return;
  var noise = [
    'Could not establish connection. Receiving end does not exist.',
    'The message port closed before a response was received.',
    'Extension context invalidated.',
    'Failed to connect to MetaMask',
    'User closed the window before completing the action',
    'Wallet request timed out',
    'chrome-extension://',
    'moz-extension://'
  ];
  function isNoise(msg) {
    if (!msg) return false;
    var str = String(msg);
    for (var i = 0; i < noise.length; i++) {
      if (str.indexOf(noise[i]) !== -1) return true;
    }
    return false;
  }
  window.addEventListener('unhandledrejection', function(e) {
    var reason = (e && e.reason && (e.reason.message || e.reason.stack)) || String(e && e.reason || '');
    if (isNoise(reason)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('error', function(e) {
    var msg = (e && (e.message || (e.error && e.error.message))) || '';
    if (isNoise(msg)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-[#0D0D0D] text-[#FAFAFA] ${inter.variable} ${jetbrainsMono.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="early-extension-filter"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: EARLY_EXTENSION_FILTER }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-[#0D0D0D] text-[#FAFAFA] selection:bg-[#894DEF] selection:text-[#FAFAFA]`}
        suppressHydrationWarning
      >
        <ExtensionErrorGuard>
          <NearWalletProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-[#2E2E2E] bg-[#0D0D0D] py-8 text-center text-xs text-[#B8B8B8] font-mono">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  Pandem Protocol · Built for NEAR Hackathon (Real-World Money & Privacy Tracks)
                </div>
                <div className="flex items-center gap-4 text-[#B8B8B8]">
                  <a
                    href="https://explorer.testnet.near.org"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#894DEF] transition-colors"
                  >
                    NEAR Testnet Explorer
                  </a>
                  <span>·</span>
                  <a
                    href="https://cloud.near.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#894DEF] transition-colors"
                  >
                    NEAR AI Cloud TEE
                  </a>
                </div>
              </div>
            </footer>
          </NearWalletProvider>
        </ExtensionErrorGuard>
      </body>
    </html>
  );
}
