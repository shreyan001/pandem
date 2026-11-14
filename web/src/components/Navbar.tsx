"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID } from "@pandem/shared";

interface NavLink {
  href: string;
  label: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Catalog" },
  { href: "/onramp", label: "On-Ramp" },
  { href: "/me", label: "My Agreements" },
  { href: "/steward", label: "Steward" },
  { href: "/agent", label: "Agent" },
  { href: "/components", label: "Testbed", badge: "UI" },
];

const DEV_PERSONAS = [
  { label: "Alice (Subscriber)", id: "pandem-alice-8d6888e3.testnet" },
  { label: "Steward (Provider)", id: "pandem-steward-47c388e3.testnet" },
  { label: "Agent (Enclave)", id: "pandem-agent-12a488e3.testnet" },
];

export function Navbar() {
  const pathname = usePathname();
  const { accountId, isConnected, connect, disconnect, tokenBalance, setManualAccount } = useNearWallet();
  const [showAccountInput, setShowAccountInput] = useState(false);
  const [inputAcc, setInputAcc] = useState("");

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
    <nav className="border-b border-zinc-800 bg-black/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Desktop Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 group-hover:scale-105 transition-transform">
              P
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight flex items-center gap-2 leading-tight">
                Pandem
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TESTNET
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline leading-none mt-0.5">
                SaaS Escrow Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: Escrow contract link & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all"
            title="View Escrow Contract on NEAR Testnet Explorer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-500">escrow:</span>
            <span>{PANDEM_ESCROW_ID.slice(0, 14)}...</span>
          </a>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <span className="font-mono text-white font-medium text-[11px] sm:text-xs">
                  {accountId?.slice(0, 16)}{accountId && accountId.length > 16 ? "..." : ""}
                </span>
                <span className="font-mono text-emerald-400 text-[10px] sm:text-[11px]">
                  {formatBalance(tokenBalance)} wNEAR
                </span>
              </div>
              <button
                onClick={disconnect}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Disconnect Wallet"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connect}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => setShowAccountInput(!showAccountInput)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-zinc-200 transition-colors"
                title="Switch testnet dev persona or enter account ID"
              >
                Dev Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Nav Row with horizontal overflow scrolling */}
      <div className="lg:hidden border-t border-zinc-850 bg-zinc-950/90 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm shadow-emerald-500/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
              }`}
            >
              {link.label}
              {link.badge && (
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Dev Account Quick Switcher Tray */}
      {showAccountInput && !isConnected && (
        <div className="bg-zinc-900/95 border-b border-zinc-800 px-4 py-3 text-xs space-y-2 backdrop-blur animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 font-mono text-[11px]">Quick Personas:</span>
              {DEV_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickSelect(p.id)}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700 transition-colors"
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
                className="bg-black/70 border border-zinc-700 px-3 py-1 rounded-lg text-white font-mono text-xs flex-1 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-3 py-1 rounded-lg font-mono text-xs transition-colors"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowAccountInput(false)}
                className="text-zinc-500 hover:text-zinc-300 px-1 text-sm"
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
