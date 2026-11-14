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
    <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#222222] font-sans" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-[#894DEF] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#FAFAFA] tracking-tight">
                Pandem
              </span>
              <span className="text-[11px] font-medium text-[#A1A1A1] bg-[#1A1A1A] px-2 py-0.5 border border-[#2A2A2A]">
                Testnet
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1" suppressHydrationWarning>
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
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "text-[#FAFAFA] font-medium bg-[#1A1A1A]"
                      : "text-[#A1A1A1] hover:text-[#FAFAFA] hover:bg-[#141414]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0" suppressHydrationWarning>
          <Link
            href="/dev/onboarding"
            className="bg-[#894DEF] hover:bg-[#7839DF] text-white px-4 py-2 font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Product</span>
          </Link>

          {mounted && isConnected ? (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="w-1.5 h-1.5 bg-[#22C55E]" />
                <span className="font-mono text-[#FAFAFA] text-xs">
                  {accountId?.slice(0, 14)}
                  {accountId && accountId.length > 14 ? "..." : ""}
                </span>
                <span className="text-[#737373]">|</span>
                <span className="font-mono text-[#A1A1A1] text-xs">
                  {formatBalance(tokenBalance)} wNEAR
                </span>
              </div>
              <button
                onClick={disconnect}
                className="p-2 bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-[#A1A1A1] hover:text-[#FAFAFA] transition-colors"
                title="Disconnect wallet"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="px-3.5 py-2 text-xs font-medium bg-[#141414] hover:bg-[#1A1A1A] text-[#FAFAFA] border border-[#2A2A2A] hover:border-[#383838] transition-colors flex items-center gap-2"
            >
              <Wallet className="w-3.5 h-3.5 text-[#A1A1A1]" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Gentle Wallet Notice Banner */}
      {walletError && (
        <div className="bg-[#141414] border-t border-[#222222] px-4 py-2 text-xs flex items-center justify-between gap-2 text-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <span className="text-[#894DEF]">Notice:</span>
            <span className="text-[#A1A1A1]">{walletError}</span>
          </div>
          <button
            onClick={clearWalletError}
            className="text-[#737373] hover:text-[#FAFAFA] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </nav>
  );
}
