"use client";

import React from "react";
import Link from "next/link";
import { Badge, Button, PageHeader } from "../../ui";

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
    <section className="space-y-4 pt-1">
      {/* Connected Account Bar (compact) */}
      {isConnected && accountId && (
        <div className="p-2.5 bg-spectr-surface border border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono rounded-none">
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

      {/* Compact PageHeader Band */}
      <PageHeader
        title="The launchpad for confidential software on NEAR"
        description="Discover and monetize applications executing inside verified hardware enclaves. Subscriptions lock in native escrow and release on verified heartbeats."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="primary">Confidential SaaS</Badge>
            <Badge variant="default" dot>Intel TDX + Escrow</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onUserPathway}
            >
              Browse Directory
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onDeveloperPathway}
            >
              Launch Product
            </Button>
          </div>
        }
        className="pb-4 mb-2"
      />
    </section>
  );
};
