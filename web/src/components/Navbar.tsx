"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID } from "@pandem/shared";

interface NavLink {
  href: string;
  label: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Catalog" },
  { href: "/dashboard", label: "Dashboard", badge: "Sub" },
  { href: "/dev/dashboard", label: "Developer", badge: "Dev" },
  { href: "/me", label: "Session" },
  { href: "/governance", label: "Governance" },
  { href: "/agent", label: "Agent Enclave" },
  { href: "/components", label: "UI Kit" },
];

const DEV_PERSONAS = [
  { label: "Alice (Subscriber)", id: "pandem-alice-8d6888e3.testnet" },
  { label: "Steward (Provider)", id: "pandem-steward-47c388e3.testnet" },
  { label: "Agent (Enclave)", id: "pandem-agent-12a488e3.testnet" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    accountId,
    isConnected,
    connect,
    disconnect,
    tokenBalance,
    setManualAccount,
    walletError,
    clearWalletError,
  } = useNearWallet();
  const [showAccountInput, setShowAccountInput] = useState(false);
  const [inputAcc, setInputAcc] = useState("");
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

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAcc.trim()) {
      setManualAccount(inputAcc.trim());
      setShowAccountInput(false);
      setInputAcc("");
    }
  };

  const handleQuickSelect = (accId: string) => {
    setManualAccount(accId);
    setShowAccountInput(false);
    setInputAcc("");
  };

  return (
    <nav className="border-b border-[#2E2E2E] bg-[#0D0D0D] sticky top-0 z-50 rounded-none" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Desktop Links */}
        <div className="flex items-center gap-6">
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
                SaaS Escrow Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1" suppressHydrationWarning>
            {NAV_LINKS.map((link) => {
              const isActive = mounted ? pathname === link.href : link.href === "/";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-none text-xs font-mono font-medium transition-colors flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-[#171717] text-[#FAFAFA] border-[#894DEF]"
                      : "text-[#B8B8B8] hover:text-[#FAFAFA] hover:bg-[#171717] border-transparent"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1 py-0.5 rounded-none bg-[#262626] text-[#B8B8B8] border border-[#2E2E2E]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Escrow contract link & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" suppressHydrationWarning>
          <a
            href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-[#B8B8B8] bg-[#171717] px-2.5 py-1.5 rounded-none border border-[#2E2E2E] hover:border-[#894DEF] hover:text-[#FAFAFA] transition-colors"
            title="View Escrow Contract on NEAR Testnet Explorer"
          >
            <span className="w-1.5 h-1.5 rounded-none bg-[#894DEF]" />
            <span className="text-[#6B6B6B]">escrow:</span>
            <span>{PANDEM_ESCROW_ID.slice(0, 14)}...</span>
          </a>

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
                className="px-3 py-1.5 rounded-none text-xs font-mono bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-[#B8B8B8] hover:text-[#FAFAFA] transition-colors"
                title="Disconnect Wallet"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <button
                onClick={connect}
                className="px-4 py-2 rounded-none text-xs sm:text-sm font-semibold bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] transition-colors flex items-center gap-1.5"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => setShowAccountInput(!showAccountInput)}
                className="px-3 py-2 rounded-none text-xs font-mono bg-[#171717] hover:bg-[#262626] text-[#B8B8B8] border border-[#2E2E2E] hover:text-[#FAFAFA] transition-colors"
                title="Switch testnet dev persona or enter account ID"
              >
                Dev Account
              </button>
            </div>
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

      {/* Mobile & Tablet Nav Row */}
      <div
        className="lg:hidden border-t border-[#2E2E2E] bg-[#171717] px-4 py-2 flex items-center gap-1.5 overflow-x-auto"
        suppressHydrationWarning
      >
        {NAV_LINKS.map((link) => {
          const isActive = mounted ? pathname === link.href : link.href === "/";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-none text-xs font-mono whitespace-nowrap transition-colors shrink-0 border ${
                isActive
                  ? "bg-[#262626] text-[#FAFAFA] border-[#894DEF] font-semibold"
                  : "text-[#B8B8B8] hover:text-[#FAFAFA] hover:bg-[#262626] border-transparent"
              }`}
            >
              {link.label}
              {link.badge && (
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded-none bg-[#0D0D0D] text-[#B8B8B8] border border-[#2E2E2E]">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Dev Account Quick Switcher Tray */}
      {showAccountInput && !isConnected && (
        <div className="bg-[#171717] border-b border-[#2E2E2E] px-4 py-3 text-xs space-y-2" suppressHydrationWarning>
          <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#B8B8B8] font-mono text-[11px]">Quick Personas:</span>
              {DEV_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickSelect(p.id)}
                  className="px-2.5 py-1 rounded-none bg-[#262626] hover:bg-[#0D0D0D] text-[#FAFAFA] font-mono text-[11px] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleManualConnect} className="flex items-center gap-2 flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Custom testnet account (e.g. alice.testnet)"
                value={inputAcc}
                onChange={(e) => setInputAcc(e.target.value)}
                className="bg-[#0D0D0D] border border-[#2E2E2E] px-3 py-1.5 rounded-none text-[#FAFAFA] font-mono text-xs flex-1 focus:outline-none focus:border-[#894DEF]"
              />
              <button
                type="submit"
                className="bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] font-semibold px-3 py-1.5 rounded-none font-mono text-xs transition-colors"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowAccountInput(false)}
                className="text-[#B8B8B8] hover:text-[#FAFAFA] px-2 text-sm"
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
