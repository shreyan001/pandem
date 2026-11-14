"use client";

import React, { useState } from "react";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../ui";
import { Check, Sparkles, Shield, Zap } from "lucide-react";

export interface PricingTableProps {
  productName: string;
  onSelectTier: (tierId: "free" | "pro" | "max", yearly: boolean) => void;
}

export function PricingTable({ productName, onSelectTier }: PricingTableProps) {
  const [isYearly, setIsYearly] = useState<boolean>(true);

  const tiers = [
    {
      id: "free" as const,
      name: "Free",
      tagline: "Community & Evaluation",
      priceMonthly: 0,
      priceYearly: 0,
      description: "Basic evaluation sandbox with community rate limits.",
      features: [
        "Public directory access",
        "Community client sandbox",
        "Public healthz monitoring",
        "Standard community support",
      ],
      icon: Shield,
      popular: false,
    },
    {
      id: "pro" as const,
      name: "Pro",
      tagline: "Confidential Production",
      priceMonthly: 5,
      priceYearly: 50, // 10x monthly
      description: "Hardware-enforced Intel TDX private inference and encrypted database.",
      features: [
        "Dedicated Intel TDX Enclave",
        "Zero prompt / query retention",
        "KMS-sealed encrypted storage",
        "7-day escrow refund guarantee",
        "Autonomous agent budget support",
      ],
      icon: Sparkles,
      popular: true,
    },
    {
      id: "max" as const,
      name: "Max",
      tagline: "Enterprise & High-Throughput",
      priceMonthly: 15,
      priceYearly: 150, // 10x monthly
      description: "Priority hardware execution with multi-region redundancy and dedicated RAM.",
      features: [
        "Priority enclave queueing",
        "Dedicated 32GB enclave memory",
        "Real-time SLA heartbeat monitors",
        "Direct steward bounty governance",
        "Full tripartite escrow protection",
      ],
      icon: Zap,
      popular: false,
    },
  ];

  return (
    <section className="space-y-6 pt-4 font-sans">
      {/* Header & Billing Cycle Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-spectr-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary">Graded Tiers</Badge>
            <Badge variant="default">NEP-141 USDC</Badge>
          </div>
          <h2 className="text-2xl font-bold text-spectr-ink">
            Subscription Pricing & Plans
          </h2>
          <p className="text-xs text-spectr-body font-mono">
            Protected by native escrow on NEAR. Unreleased funds remain refundable.
          </p>
        </div>

        {/* Monthly / Yearly Switch */}
        <div className="flex items-center gap-2 bg-spectr-surface p-1 border border-spectr-hairline">
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              !isYearly
                ? "bg-spectr-primary text-spectr-ink font-bold"
                : "text-spectr-muted hover:text-spectr-ink"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isYearly
                ? "bg-spectr-primary text-spectr-ink font-bold"
                : "text-spectr-muted hover:text-spectr-ink"
            }`}
          >
            <span>Yearly</span>
            <span className="text-[11px] px-1 py-0.2 bg-spectr-canvas text-spectr-success font-semibold border border-spectr-hairline">
              2 mo free (-16.7%)
            </span>
          </button>
        </div>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((t) => {
          const Icon = t.icon;
          const displayPrice = isYearly ? t.priceYearly : t.priceMonthly;
          const displayCycle = isYearly ? "/year" : "/month";

          return (
            <Card
              key={t.id}
              className={`flex flex-col justify-between transition-all ${
                t.popular
                  ? "border-spectr-primary shadow-[0_0_15px_rgba(137,77,239,0.15)] bg-spectr-surface"
                  : "border-spectr-hairline bg-spectr-surface"
              }`}
            >
              <div>
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={t.popular ? "primary" : "default"}>
                      {t.name}
                    </Badge>
                    <Icon
                      className={`w-4 h-4 ${
                        t.popular ? "text-spectr-primary" : "text-spectr-muted"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <p className="text-xs text-spectr-muted font-mono">{t.tagline}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="p-3 bg-spectr-canvas border border-spectr-hairline space-y-1">
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-3xl font-bold text-spectr-ink">
                        ${displayPrice}
                      </span>
                      <span className="text-xs text-spectr-muted font-mono">
                        tUSDC {displayCycle}
                      </span>
                    </div>
                    {isYearly && t.priceMonthly > 0 && (
                      <p className="text-xs text-spectr-success font-mono">
                        Billed as 10 months (Save ${t.priceMonthly * 2} tUSDC/yr)
                      </p>
                    )}
                    {t.priceMonthly === 0 && (
                      <p className="text-xs text-spectr-muted font-mono">
                        No blockchain payment required
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-spectr-body leading-relaxed">
                    {t.description}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-spectr-hairline text-xs font-mono text-spectr-body">
                    {t.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          className="w-3.5 h-3.5 text-spectr-success shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-4">
                <Button
                  type="button"
                  variant={t.popular ? "primary" : "outline"}
                  className="w-full justify-center text-xs font-mono"
                  onClick={() => onSelectTier(t.id, isYearly)}
                >
                  {t.id === "free"
                    ? "Get Free Access"
                    : `Subscribe to ${t.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
