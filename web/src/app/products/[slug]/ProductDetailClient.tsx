"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EnrichedProduct, CatalogItem } from "@pandem/shared";
import { ProductHeader } from "../../../components/product/ProductHeader";
import { TreasuryAutopaymentCard } from "../../../components/product/TreasuryAutopaymentCard";
import { DeveloperActivityCard } from "../../../components/product/DeveloperActivityCard";
import { SubscriberRequestsCard } from "../../../components/product/SubscriberRequestsCard";
import { SubscriberBugCenterCard } from "../../../components/product/SubscriberBugCenterCard";
import { SubscribeModal } from "../../../components/SubscribeModal";
import { Badge, Card, CardHeader, CardTitle, CardContent } from "../../../ui";

export interface ProductDetailClientProps {
  product: EnrichedProduct;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);

  // Convert to CatalogItem format for SubscribeModal
  const catalogItem: CatalogItem = {
    id: String(product.product_id),
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    price_per_period: "5000000",
    price_display: "5 tUSDC",
    period_seconds: 2592000,
    period_display: "30 days",
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-spectr-canvas font-sans">
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

      {/* Main Product Header */}
      <ProductHeader
        product={product}
        onSubscribeClick={() => setIsSubscribeOpen(true)}
      />

      {/* Real-Life Problem & Privacy Violation Spotlight */}
      <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" dot>
            Real-Life Crisis Solved: Privacy & Data Exploitation
          </Badge>
        </div>
        <h3 className="text-lg font-bold text-spectr-ink font-sans">
          {product.privacy_problem}
        </h3>
        <p className="text-xs sm:text-sm text-spectr-body leading-relaxed max-w-3xl">
          Centralized SaaS platforms and public AI models log queries, retain confidential IP, and expose unencrypted user data to third-party data brokers and regulatory subpoenas.
          <strong className="text-spectr-ink block mt-1">
            Pandem isolates execution within hardware-attested confidential TEE enclaves. Data self-destructs post-inference.
          </strong>
        </p>
      </Card>

      {/* On-Chain Treasury & Autopayment System Card */}
      <TreasuryAutopaymentCard product={product} />

      {/* Grid: Developer Reputation & Activity */}
      <DeveloperActivityCard developer={product.developer} />

      {/* Grid: Subscriber Requests & Governance Voting */}
      <SubscriberRequestsCard
        proposals={product.proposals}
        productId={product.product_id}
      />

      {/* Subscriber Bug Center & 7% Warranty Reserve Tracking */}
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
