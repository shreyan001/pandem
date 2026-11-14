"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EnrichedProduct, CatalogItem } from "@pandem/shared";
import { ProductHeader } from "../../../components/product/ProductHeader";
import { PricingTable } from "../../../components/product/PricingTable";
import { TreasuryAutopaymentCard } from "../../../components/product/TreasuryAutopaymentCard";
import { DeveloperActivityCard } from "../../../components/product/DeveloperActivityCard";
import { SubscriberRequestsCard } from "../../../components/product/SubscriberRequestsCard";
import { SubscriberBugCenterCard } from "../../../components/product/SubscriberBugCenterCard";
import { SubscribeModal } from "../../../components/SubscribeModal";
import { Badge, Card } from "../../../ui";

export interface ProductDetailClientProps {
  product: EnrichedProduct;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<"free" | "pro" | "max">("pro");
  const [selectedYearly, setSelectedYearly] = useState<boolean>(true);

  const handleSelectTier = (tier: "free" | "pro" | "max", yearly: boolean) => {
    setSelectedTier(tier);
    setSelectedYearly(yearly);
    setIsSubscribeOpen(true);
  };

  // Convert to CatalogItem format for SubscribeModal
  const catalogItem: CatalogItem = {
    id: String(product.product_id),
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    price_per_period: selectedTier === "max" ? "15000000" : "5000000",
    price_display: selectedTier === "max" ? "15 tUSDC" : "5 tUSDC",
    period_seconds: selectedYearly ? 31536000 : 2592000,
    period_display: selectedYearly ? "365 days" : "30 days",
    grace_seconds: 604800,
    grace_display: "7 days",
    category: product.category,
    status: "Active",
    features: product.roadmap.map((r) => r.title),
    upvotes: 100,
    rank: 1,
    steward: product.steward,
    teeHardware: product.tee_hardware,
    teeModel: product.tee_model,
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-spectr-canvas font-sans">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono text-spectr-muted">
        <Link href="/" className="hover:text-spectr-ink transition-colors">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-spectr-body">{product.suite}</span>
        <span>/</span>
        <span className="text-spectr-primary font-semibold">{product.name}</span>
      </nav>

      {/* 1. Main Product Header (with 16:9 Cover & Logo Inset) */}
      <ProductHeader
        product={product}
        onSubscribeClick={() => setIsSubscribeOpen(true)}
      />

      {/* 2. Graded Subscription Pricing Table (Immediately below Header!) */}
      <PricingTable
        productName={product.name}
        onSelectTier={handleSelectTier}
      />

      {/* 3. Real-Life Problem & Privacy Violation Spotlight */}
      <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-3 rounded-none">
        <div className="flex items-center gap-2">
          <Badge variant="primary" dot>
            Real-Life Crisis Solved: Privacy & Data Exploitation
          </Badge>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-spectr-ink font-sans">
          {product.privacy_problem}
        </h3>
        <p className="text-xs sm:text-sm text-spectr-body leading-relaxed max-w-3xl">
          Centralized SaaS platforms log prompts and expose unencrypted user data.
          <strong className="text-spectr-ink block mt-1">
            Pandem isolates execution within hardware-attested Intel TDX confidential enclaves. Data self-destructs post-inference.
          </strong>
        </p>
      </Card>

      {/* 4. On-Chain Treasury & Autopayment System Card */}
      <TreasuryAutopaymentCard product={product} />

      {/* 5. Grid: Developer Reputation & Activity */}
      <DeveloperActivityCard developer={product.developer} />

      {/* 6. Grid: Subscriber Requests & Governance Voting */}
      <SubscriberRequestsCard
        proposals={product.proposals}
        productId={product.product_id}
      />

      {/* 7. Subscriber Bug Center & 7% Warranty Reserve Tracking */}
      <SubscriberBugCenterCard
        bugReports={product.bug_reports}
        treasury={product.treasury}
        productId={product.product_id}
      />

      {/* Subscription Checkout Modal */}
      {isSubscribeOpen && (
        <SubscribeModal
          product={catalogItem}
          onClose={() => setIsSubscribeOpen(false)}
        />
      )}
    </main>
  );
};
