"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useNearWallet } from "../context/NearWalletContext";
import { Wallet, Plus, LogOut, ShieldCheck, X, Sparkles } from "lucide-react";
import { OnboardingDrawer } from "./OnboardingDrawer";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/#storefront", label: "Storefront" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dev/dashboard", label: "Developer" },
  { href: "/verify", label: "Verify" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    accountId,
    isConnected,
    connect,
    disconnect,
    tokenBalance,
    claimFaucet,
    walletError,
    clearWalletError,
  } = useNearWallet();
  const [mounted, setMounted] = useState(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("onboard") === "1" || params.get("onboard") === "true") {
        setIsOnboardingOpen(true);
      }
    }
  }, []);

  const handleClaimFaucet = async () => {
    try {
      setIsClaimingFaucet(true);
      await claimFaucet();
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  // Format 6-decimal tUSDC to human readable
  const formatBalance = (raw: string) => {
    if (!raw || raw === "0") return "0.00";
    try {
      const len = raw.length;
      if (len <= 6) {
        const padded = raw.padStart(6, "0");
        return `0.${padded.slice(0, 2)}`;
      }
      const whole = raw.slice(0, len - 6);
      const frac = raw.slice(len - 6, len - 4);
      return `${whole}.${frac}`;
    } catch {
      return raw;
    }
  };

  // Truncate long account IDs for mobile (e.g. alice...testnet)
  const truncateAccountMobile = (acc: string | null) => {
    if (!acc) return "";
    if (acc.length <= 14) return acc;
    const parts = acc.split(".");
    if (parts.length > 1) {
      const user = parts[0];
      const suffix = parts.slice(1).join(".");
      const shortUser = user.length > 5 ? user.slice(0, 5) : user;
      return `${shortUser}...${suffix}`;
    }
    return `${acc.slice(0, 5)}...${acc.slice(-5)}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-spectr-canvas/95 backdrop-blur-md border-b border-spectr-hairline font-sans" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
            aria-label="Pandem Home"
          >
            <div className="w-8 h-8 bg-spectr-primary flex items-center justify-center text-spectr-ink shrink-0">
              <ShieldCheck className="w-4 h-4 text-spectr-ink" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-spectr-ink tracking-tight font-sans">
                Pandem
              </span>
              <span className="text-xs font-mono font-medium text-spectr-muted bg-spectr-surface px-2 py-0.5 border border-spectr-hairline">
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
                  className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary ${
                    isActive
                      ? "text-spectr-ink bg-spectr-surface-raised"
                      : "text-spectr-body hover:text-spectr-ink hover:bg-spectr-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Clean layout on 390px, no CTA collision */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" suppressHydrationWarning>
          {/* Launch Product: hidden on mobile (<640px) to prevent collision with wallet button */}
          <Link
            href="/dev/onboarding"
            className="hidden sm:inline-flex bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink px-3 py-1.5 text-xs font-medium transition-colors items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Launch Product</span>
          </Link>

          {mounted && isConnected ? (
            <div className="flex items-center gap-1.5 sm:gap-2" suppressHydrationWarning>
              {/* Claim Faucet: hidden on mobile */}
              <button
                type="button"
                onClick={handleClaimFaucet}
                disabled={isClaimingFaucet}
                className="hidden sm:inline-flex px-2.5 py-1.5 text-xs font-mono font-medium bg-spectr-surface hover:bg-spectr-surface-raised text-spectr-primary hover:text-spectr-primary-hover border border-spectr-hairline transition-colors items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
                title="Claim 100 test USDC (once per 24 hours)"
              >
                <span>{isClaimingFaucet ? "Claiming..." : "Get test USDC"}</span>
              </button>

              {/* Account identity badge: truncated on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-spectr-surface border border-spectr-hairline text-xs">
                <span className="w-1.5 h-1.5 bg-spectr-success shrink-0" aria-hidden="true" />
                <span className="font-mono text-spectr-ink text-xs sm:hidden">
                  {truncateAccountMobile(accountId)}
                </span>
                <span className="font-mono text-spectr-ink text-xs hidden sm:inline">
                  {accountId?.length && accountId.length > 16
                    ? `${accountId.slice(0, 10)}...${accountId.slice(-6)}`
                    : accountId}
                </span>
                <span className="text-spectr-hairline hidden md:inline" aria-hidden="true">|</span>
                <span className="font-mono text-spectr-body text-xs tabular-nums hidden md:inline">
                  {formatBalance(tokenBalance)} tUSDC
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="hidden sm:inline-flex px-2 py-1.5 text-xs font-mono font-medium bg-spectr-surface hover:bg-spectr-surface-raised text-spectr-body hover:text-spectr-ink border border-spectr-hairline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
                title="Open 3-step payments onboarding"
              >
                <span>Setup</span>
              </button>

              <button
                type="button"
                onClick={disconnect}
                className="p-1.5 bg-spectr-surface hover:bg-spectr-surface-raised border border-spectr-hairline text-spectr-muted hover:text-spectr-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary shrink-0"
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
                aria-label="Get started with Pandem"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Get started</span>
              </button>

              <button
                type="button"
                onClick={connect}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium bg-spectr-surface hover:bg-spectr-surface-raised text-spectr-ink border border-spectr-hairline transition-colors items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
                aria-label="Connect NEAR Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-spectr-muted" aria-hidden="true" />
                <span>Connect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <OnboardingDrawer
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {walletError && (
        <div className="bg-spectr-surface border-t border-spectr-hairline px-4 py-2 text-xs flex items-center justify-between gap-2 text-spectr-ink" role="alert">
          <div className="flex items-center gap-2">
            <span className="text-spectr-primary font-medium">Notice:</span>
            <span className="text-spectr-body">{walletError}</span>
          </div>
          <button
            type="button"
            onClick={clearWalletError}
            className="text-spectr-muted hover:text-spectr-ink p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-spectr-primary"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
