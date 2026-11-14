"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "../../../../ui";

export interface ActiveSessionData {
  accountId: string;
  productId: number;
  slug: string;
  agreementId: number;
  tierId: string;
  remainingPeriods: number;
  remainingDays: number;
  fundedPeriods: number;
  releasedPeriods: number;
  expiresInSeconds?: number;
}

export interface ActiveProductData {
  name: string;
  slug: string;
  category?: string;
  website_url: string;
  demo_url: string;
  tier: string;
}

interface AccessActiveViewProps {
  session: ActiveSessionData;
  product: ActiveProductData;
  token: string;
  onClearSession: () => void;
}

export const AccessActiveView: React.FC<AccessActiveViewProps> = ({
  session,
  product,
  token,
  onClearSession,
}) => {
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`pandem_email_${session.productId}_${session.accountId}`);
      if (stored) {
        setEmail(stored);
        setEmailSaved(true);
      }
    } catch {
      // ignore
    }
  }, [session.productId, session.accountId]);

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    try {
      setIsSavingEmail(true);
      localStorage.setItem(`pandem_email_${session.productId}_${session.accountId}`, email.trim());

      await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_email",
          email: email.trim(),
          accountId: session.accountId,
          slug: product.slug,
        }),
      });

      setEmailSaved(true);
    } catch (err) {
      console.warn("Email save fallback to localStorage:", err);
      setEmailSaved(true);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const truncatedToken = token
    ? `${token.slice(0, 16)}...${token.slice(-16)}`
    : "authenticated_session";

  return (
    <div className="space-y-6">
      {/* Session Authenticated Banner */}
      <div className="p-4 bg-spectr-surface-raised border border-spectr-success flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-spectr-success inline-block" />
          <span className="text-sm font-semibold text-spectr-ink">
            Subscription Verified • Real Access Link Unlocked
          </span>
          <Badge variant="success">Active Enclave</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-spectr-muted">
            NEP-413 Signed · Agreement #{session.agreementId}
          </span>
          <button
            type="button"
            onClick={onClearSession}
            className="text-xs font-mono text-spectr-muted hover:text-spectr-ink underline"
          >
            Lock Session
          </button>
        </div>
      </div>

      {/* Main Real Links & Access Credentials */}
      <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-spectr-ink font-sans">
                {product.name}
              </h2>
              <Badge variant="primary" className="uppercase">
                {session.tierId} Tier
              </Badge>
            </div>
            <p className="text-xs text-spectr-muted font-mono mt-1">
              Beneficiary Account: {session.accountId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="px-3 py-1.5 rounded-none bg-spectr-surface-raised text-spectr-body hover:text-spectr-ink font-mono text-xs border border-spectr-hairline transition-colors"
            >
              Product Details →
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-none bg-spectr-surface-raised text-spectr-body hover:text-spectr-ink font-mono text-xs border border-spectr-hairline transition-colors"
            >
              Subscription Dashboard →
            </Link>
          </div>
        </div>

        {/* Protection Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-spectr-canvas border border-spectr-hairline">
            <span className="text-xs font-mono text-spectr-muted block uppercase">
              Protected Period
            </span>
            <span className="text-xl font-bold text-spectr-ink font-mono mt-1 block">
              {session.remainingPeriods} Period{session.remainingPeriods !== 1 ? "s" : ""} Left
            </span>
            <span className="text-xs text-spectr-body font-mono mt-0.5 block">
              {session.fundedPeriods} funded · {session.releasedPeriods} released
            </span>
          </div>

          <div className="p-4 bg-spectr-canvas border border-spectr-hairline">
            <span className="text-xs font-mono text-spectr-muted block uppercase">
              Remaining Escrow Time
            </span>
            <span className="text-xl font-bold text-spectr-success font-mono mt-1 block">
              ~{session.remainingDays} Days Protected
            </span>
            <span className="text-xs text-spectr-body font-mono mt-0.5 block">
              Heartbeat SLA enforced
            </span>
          </div>

          <div className="p-4 bg-spectr-canvas border border-spectr-hairline">
            <span className="text-xs font-mono text-spectr-muted block uppercase">
              Enclave Session Token
            </span>
            <span className="text-xs font-mono text-spectr-primary mt-2 block break-all">
              {truncatedToken}
            </span>
            <span className="text-xs text-spectr-muted font-mono mt-0.5 block">
              HMAC-SHA256 • 1-hour expiry
            </span>
          </div>
        </div>

        {/* Real Product Links: Website URL and Demo URL */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold uppercase text-spectr-ink font-mono tracking-wide">
            Live Service Endpoints (Real URLs)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real Website URL */}
            <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-spectr-muted uppercase font-semibold">
                  Official Website
                </span>
                <Badge variant="default">Production</Badge>
              </div>
              <p className="text-xs text-spectr-body font-mono break-all">
                {product.website_url}
              </p>
              <a
                href={product.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-none bg-spectr-primary hover:bg-spectr-primary-hover text-spectr-ink font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-spectr-primary"
              >
                <span>Launch Official Website</span>
                <span>↗</span>
              </a>
            </div>

            {/* Real Demo URL */}
            <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-spectr-muted uppercase font-semibold">
                  Sandbox & Demo Instance
                </span>
                <Badge variant="primary">Interactive Demo</Badge>
              </div>
              <p className="text-xs text-spectr-body font-mono break-all">
                {product.demo_url}
              </p>
              <a
                href={product.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-none bg-spectr-surface-raised hover:bg-spectr-surface-raised/80 text-spectr-ink font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-spectr-hairline"
              >
                <span>Open Live Demo</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Optional Off-chain Email Capture */}
        <div className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-spectr-ink">
                Product Updates & Key Recovery
              </span>
              <span className="text-xs font-mono text-spectr-muted bg-spectr-surface border border-spectr-hairline px-1.5 py-0.5">
                off-chain, used only for product updates
              </span>
            </div>
            <span className="text-xs font-mono text-spectr-muted">
              Never stored on blockchain
            </span>
          </div>

          <p className="text-xs text-spectr-body">
            Receive notification if heartbeat liveness falters or when monthly release tranches are scheduled.
          </p>

          {emailSaved ? (
            <div className="p-3 bg-spectr-surface border border-spectr-success text-xs font-mono text-spectr-success flex items-center justify-between">
              <span>✓ Email recorded off-chain: {email}</span>
              <button
                type="button"
                onClick={() => setEmailSaved(false)}
                className="text-spectr-muted hover:text-spectr-ink underline text-xs ml-2"
              >
                Change
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@domain.com"
                className="flex-1 px-3 py-2 bg-spectr-surface border border-spectr-hairline text-spectr-ink placeholder-spectr-muted text-xs font-mono focus:outline-none focus:border-spectr-primary"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isSavingEmail}
              >
                Save Off-Chain Email
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
