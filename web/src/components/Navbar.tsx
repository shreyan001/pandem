"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useNearWallet } from "../context/NearWalletContext";

interface NavLink {
  href: string;
  label: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/#storefront", label: "Storefront" },
  { href: "/dashboard", label: "Dashboard", badge: "Sub" },
  { href: "/dev/dashboard", label: "Developer", badge: "Dev" },
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
    <nav className="border-b border-[#2E2E2E] bg-[#0D0D0D] sticky top-0 z-50 rounded-none font-sans" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Clean Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <span className="w-8 h-8 rounded-none bg-[#894DEF] border border-[#FAFAFA] flex items-center justify-center font-mono font-bold text-[#FAFAFA] text-sm">
              P
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-[#FAFAFA] text-base tracking-tight flex items-center gap-2 leading-tight">
                Pandem
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none bg-[#171717] text-[#894DEF] border border-[#2E2E2E]">
                  TESTNET
                </span>
              </span>
              <span className="text-[11px] text-[#B8B8B8] font-mono hidden sm:inline leading-none mt-0.5">
                Sovereign SaaS & Enclaves
              </span>
            </div>
          </Link>

          {/* Clean Nav Links: Storefront, Dashboard, Developer ONLY */}
          <div className="hidden md:flex items-center gap-2" suppressHydrationWarning>
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
                  className={`px-3.5 py-2 rounded-none text-xs font-mono font-medium transition-colors flex items-center gap-2 border ${
                    isActive
                      ? "bg-[#171717] text-[#FAFAFA] border-[#894DEF]"
                      : "text-[#B8B8B8] hover:text-[#FAFAFA] hover:bg-[#171717] border-transparent"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E] font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 shrink-0" suppressHydrationWarning>
          {/* Launch Product CTA */}
          <Link
            href="/dev/onboarding"
            className="px-4 py-2 rounded-none text-xs sm:text-sm font-bold bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] transition-colors flex items-center gap-1.5 shadow-none"
          >
            <span>+ Launch Product</span>
          </Link>

          {/* Wallet State */}
          {mounted && isConnected ? (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="flex flex-col items-end px-3 py-1 rounded-none bg-[#171717] border border-[#2E2E2E] text-xs">
                <span className="font-mono text-[#FAFAFA] font-medium text-[11px] sm:text-xs">
                  {accountId?.slice(0, 16)}
                  {accountId && accountId.length > 16 ? "..." : ""}
                </span>
                <span className="font-mono text-[#894DEF] text-[10px] sm:text-[11px] font-semibold">
                  {formatBalance(tokenBalance)} wNEAR
                </span>
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-2 rounded-none text-xs font-mono bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-[#B8B8B8] hover:text-[#FAFAFA] transition-colors"
                title="Disconnect Wallet"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="px-4 py-2 rounded-none text-xs sm:text-sm font-semibold bg-[#171717] hover:bg-[#262626] text-[#FAFAFA] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors flex items-center gap-1.5"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Gentle Wallet Notice Banner */}
      {walletError && (
        <div className="bg-[#171717] border-t border-b border-[#2E2E2E] px-4 py-2 text-xs flex items-center justify-between gap-2 text-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-[#894DEF]">ℹ</span>
            <span>{walletError}</span>
          </div>
          <button
            onClick={clearWalletError}
            className="text-[#B8B8B8] hover:text-[#FAFAFA] text-xs font-mono px-2 py-0.5 rounded-none bg-[#262626] border border-[#2E2E2E]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Nav Row */}
      <div
        className="md:hidden border-t border-[#2E2E2E] bg-[#171717] px-4 py-2 flex items-center gap-2 overflow-x-auto"
        suppressHydrationWarning
      >
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
              className={`px-3 py-1 rounded-none text-xs font-mono whitespace-nowrap transition-colors shrink-0 border ${
                isActive
                  ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF] font-semibold"
                  : "text-[#B8B8B8] hover:text-[#FAFAFA] hover:bg-[#262626] border-transparent"
              }`}
            >
              {link.label}
              {link.badge && (
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded-none bg-[#0D0D0D] text-[#894DEF] border border-[#2E2E2E]">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
