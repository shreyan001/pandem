"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { Wallet, Plus, LogOut, ShieldCheck, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/#storefront", label: "Storefront" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dev/dashboard", label: "Developer" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    accountId,
    isConnected,
    connect,
    disconnect,
    tokenBalance,
    walletError,
    clearWalletError,
  } = useNearWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format yocto wNEAR to human readable (24 decimals)
  const formatBalance = (yocto: string) => {
    if (!yocto || yocto === "0") return "0.00";
    try {
      const len = yocto.length;
      if (len <= 24) {
        const padded = yocto.padStart(24, "0");
        return `0.${padded.slice(0, 4)}`;
      }
      const whole = yocto.slice(0, len - 24);
      const frac = yocto.slice(len - 24, len - 20);
      return `${whole}.${frac}`;
    } catch {
      return yocto;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#222222] font-sans" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            aria-label="Pandem Home"
          >
            <div className="w-8 h-8 bg-[#894DEF] flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#FAFAFA] tracking-tight">
                Pandem
              </span>
              <span className="text-[11px] font-medium text-[#737373] bg-[#141414] px-2 py-0.5 border border-[#222222]">
                Testnet
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation" suppressHydrationWarning>
            {NAV_LINKS.map((link) => {
              const isActive = mounted
                ? link.href.startsWith("/#")
                  ? pathname === "/"
                  : pathname === link.href
                : false;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF] ${
                    isActive
                      ? "text-[#FAFAFA] bg-[#181818]"
                      : "text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#141414]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0" suppressHydrationWarning>
          <Link
            href="/dev/onboarding"
            className="bg-[#894DEF] hover:bg-[#7839DF] text-white px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Launch Product</span>
          </Link>

          {mounted && isConnected ? (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#222222] text-xs">
                <span className="w-1.5 h-1.5 bg-[#22C55E]" aria-hidden="true" />
                <span className="font-mono text-[#FAFAFA] text-xs">
                  {accountId?.slice(0, 14)}
                  {accountId && accountId.length > 14 ? "..." : ""}
                </span>
                <span className="text-[#333333]" aria-hidden="true">|</span>
                <span className="font-mono text-[#A1A1A1] text-xs tabular-nums">
                  {formatBalance(tokenBalance)} wNEAR
                </span>
              </div>
              <button
                type="button"
                onClick={disconnect}
                className="p-1.5 bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#141414] hover:bg-[#181818] text-[#FAFAFA] border border-[#222222] hover:border-[#333333] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
              aria-label="Connect NEAR Wallet"
            >
              <Wallet className="w-3.5 h-3.5 text-[#8A8A8A]" aria-hidden="true" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {walletError && (
        <div className="bg-[#141414] border-t border-[#222222] px-4 py-2 text-xs flex items-center justify-between gap-2 text-[#FAFAFA]" role="alert">
          <div className="flex items-center gap-2">
            <span className="text-[#894DEF] font-medium">Notice:</span>
            <span className="text-[#A1A1A1]">{walletError}</span>
          </div>
          <button
            type="button"
            onClick={clearWalletError}
            className="text-[#737373] hover:text-[#FAFAFA] p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#894DEF]"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
