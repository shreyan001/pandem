"use client";

import Link from "next/link";
import { useState } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID } from "@pandem/shared";

export function Navbar() {
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
    }
  };

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 group-hover:scale-105 transition-transform">
              P
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
                Pandem
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TESTNET
                </span>
              </span>
              <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                SaaS Escrow Protocol
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Catalog
            </Link>
            <Link
              href="/me"
              className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              My Agreements (/me)
            </Link>
            <Link
              href="/steward"
              className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Steward (/steward)
            </Link>
            <Link
              href="/agent"
              className="px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Agent (/agent)
            </Link>
          </div>
        </div>

        {/* Right side: Contract info & Wallet */}
        <div className="flex items-center gap-3">
          <a
            href={`https://explorer.testnet.near.org/accounts/${PANDEM_ESCROW_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all"
            title="View Escrow Contract on NEAR Testnet Explorer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-500">escrow:</span>
            <span>{PANDEM_ESCROW_ID.slice(0, 16)}...</span>
          </a>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                <span className="font-mono text-white font-medium">
                  {accountId?.slice(0, 18)}{accountId && accountId.length > 18 ? "..." : ""}
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {formatBalance(tokenBalance)} wNEAR
                </span>
              </div>
              <button
                onClick={disconnect}
                className="px-2.5 py-1.5 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Disconnect Wallet"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connect}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => setShowAccountInput(!showAccountInput)}
                className="px-2 py-1.5 rounded-md text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                title="Use custom testnet account for testing"
              >
                Dev Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dev Account quick switcher dialog */}
      {showAccountInput && !isConnected && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 text-xs flex items-center justify-between">
          <form onSubmit={handleManualConnect} className="flex items-center gap-2 max-w-xl w-full">
            <span className="text-zinc-400 whitespace-nowrap">Testnet Account ID:</span>
            <input
              type="text"
              placeholder="e.g. pandem-alice-8d6888e3.testnet"
              value={inputAcc}
              onChange={(e) => setInputAcc(e.target.value)}
              className="bg-black/60 border border-zinc-700 px-2.5 py-1 rounded text-white font-mono flex-1 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-white font-mono text-xs"
            >
              Set Active
            </button>
          </form>
          <button
            onClick={() => setShowAccountInput(false)}
            className="text-zinc-500 hover:text-zinc-400 ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </nav>
  );
}
