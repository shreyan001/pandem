"use client";

import React from "react";
import Link from "next/link";
import { Shield, Cpu } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../ui";

export interface HeroPersonaLaunchpadProps {
  isConnected: boolean;
  accountId: string | null;
  onUserPathway: () => void;
  onDeveloperPathway: () => void;
}

export const HeroPersonaLaunchpad: React.FC<HeroPersonaLaunchpadProps> = ({
  isConnected,
  accountId,
  onUserPathway,
  onDeveloperPathway,
}) => {
  return (
    <section className="space-y-8 pt-4">
      {/* Connected Account Banner */}
      {isConnected && accountId && (
        <div className="p-3 bg-spectr-surface border border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-spectr-muted">
            <span className="w-2 h-2 rounded-none bg-spectr-success" aria-hidden="true" />
            <span>Signed in as</span>
            <span className="text-spectr-ink font-semibold">{accountId}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-spectr-primary hover:text-spectr-primary-hover font-medium transition-colors"
            >
              Subscriber Dashboard
            </Link>
            <span className="text-spectr-hairline">|</span>
            <Link
              href="/dev/dashboard"
              className="text-spectr-ink hover:text-spectr-primary transition-colors"
            >
              Developer Console
            </Link>
          </div>
        </div>
      )}

      {/* Hero Title & Description */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="primary">Pandem V2 Confirmed</Badge>
          <Badge variant="default" dot>Intel TDX + NEAR Escrow</Badge>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-spectr-ink leading-[1.08]">
          The launchpad for confidential software on NEAR
        </h1>

        <p className="text-base sm:text-lg text-spectr-body leading-relaxed max-w-2xl">
          Build, host, and monetize applications where code, databases, and AI inference execute inside verified hardware enclaves. Subscriptions lock in native escrow and release on verified heartbeats.
        </p>
      </div>

      {/* Persona Pathway Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Persona 1: Subscriber */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="category">Subscriber Access</Badge>
                <Shield className="w-4 h-4 text-spectr-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl">Browse Private Software</CardTitle>
              <CardDescription>
                Subscribe to zero-knowledge AI models, confidential document vaults, and private developer tooling. Your prompts never train models, queries are never retained, and subscriptions are protected in native escrow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="default">Zero Prompt Retention</Badge>
                <Badge variant="default">Intel TDX Attested</Badge>
                <Badge variant="success">7-Day Refund Guarantee</Badge>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onUserPathway}
            >
              {isConnected ? "Go to Subscriber Dashboard" : "Browse Directory"}
            </Button>
            <a
              href="#storefront"
              className="text-xs text-spectr-muted hover:text-spectr-ink font-medium px-3 py-2 transition-colors"
            >
              View Catalog
            </a>
          </CardFooter>
        </Card>

        {/* Persona 2: Developer */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="category">Developer Studio</Badge>
                <Cpu className="w-4 h-4 text-spectr-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl">Launch a Confidential App</CardTitle>
              <CardDescription>
                Deploy your full stack into Intel TDX enclaves with turn-key NEAR AI Cloud private inference, KMS-sealed storage, and Filecoin frontend backups. Every product gets an autonomous escrow contract with 7-day payouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="default">NEAR AI Cloud H100</Badge>
                <Badge variant="default">KMS-Sealed Storage</Badge>
                <Badge variant="primary">7-Day Payout Streams</Badge>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onDeveloperPathway}
            >
              {isConnected ? "Open Developer Console" : "Launch a Product"}
            </Button>
            <Link
              href="/dev/onboarding"
              className="text-xs text-spectr-muted hover:text-spectr-ink font-medium px-3 py-2 transition-colors"
            >
              Developer Onboarding
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
};
