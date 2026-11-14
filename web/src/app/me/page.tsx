"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useNearWallet } from "../../context/NearWalletContext";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID } from "@pandem/shared";

export default function SessionPage() {
  const { accountId, isConnected, connect, disconnect } = useNearWallet();
  const [copied, setCopied] = useState<boolean>(false);

  const activeAccount = accountId || "pandem-alice-8d6888e3.testnet";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Wallet Session & Identity
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            /me Session
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Cryptographic session state, key permissions, and network endpoints for your connected NEAR account.
        </p>
      </div>

      {/* Account Identity Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Connected NEAR Account</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-emerald-400">{activeAccount}</span>
              <button
                onClick={() => handleCopy(activeAccount)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-mono"
                title="Copy address"
              >
                {copied ? "Copied!" : "📋"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <button
                onClick={disconnect}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs font-medium border border-red-500/30 transition-colors"
              >
                Disconnect Session
              </button>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold font-mono text-xs transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Technical Session Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Active Network</span>
            <div className="text-sm font-mono font-bold text-white mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>NEAR Testnet</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Chain ID: testnet</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">FastNEAR High-Speed RPC</span>
            <div className="text-sm font-mono font-bold text-cyan-400 mt-1">test.rpc.fastnear.com</div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Sub-200ms Latency</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Testnet USDC Token</span>
            <div className="text-sm font-mono font-bold text-white mt-1 truncate" title={PANDEM_TOKEN_ID}>
              {PANDEM_TOKEN_ID}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">NEP-141 Standard (6 dp)</span>
          </div>
        </div>

        {/* Cryptographic Key Permissions */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-3">
          <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
            Key Permissions & Session Capabilities
          </h4>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">Full Access Key:</span>
              <span className="text-emerald-400">ed25519:Active (HOT / Injected Wallet)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">NEP-413 Off-Chain Message Signing:</span>
              <span className="text-cyan-400">Supported (Hardware Enclave Handshake)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">Smart Contract Escrow Target:</span>
              <span className="text-zinc-300">{PANDEM_ESCROW_ID}</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs transition-colors border border-zinc-700"
          >
            ← Back to Subscriber Dashboard
          </Link>
          <Link
            href="/dev/dashboard"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs transition-colors border border-zinc-700"
          >
            Go to Developer Portal →
          </Link>
        </div>
      </div>
    </main>
  );
}
