"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENRICHED_PRODUCTS, EnrichedProduct } from "@pandem/shared";
import { ProductHeader } from "../../../components/product/ProductHeader";
import { TreasuryAutopaymentCard } from "../../../components/product/TreasuryAutopaymentCard";
import { DeveloperActivityCard } from "../../../components/product/DeveloperActivityCard";
import { SubscriberRequestsCard } from "../../../components/product/SubscriberRequestsCard";
import { SubscriberBugCenterCard } from "../../../components/product/SubscriberBugCenterCard";
import { SubscribeModal } from "../../../components/SubscribeModal";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);

  const product = ENRICHED_PRODUCTS.find((p) => p.slug.toLowerCase() === slug.toLowerCase());

  if (!product) {
    notFound();
  }

  // Convert to CatalogItem format for SubscribeModal
  const catalogItem = {
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
    status: "Active" as const,
    features: product.roadmap.map((r) => r.title),
    steward: product.steward,
    teeHardware: product.tee_hardware,
    teeModel: product.tee_model,
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#0D0D0D]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[#6B6B6B]">
        <Link href="/" className="hover:text-[#FAFAFA] transition-colors">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-[#B8B8B8]">{product.suite}</span>
        <span>/</span>
        <span className="text-[#894DEF] font-semibold">{product.name}</span>
      </nav>

      {/* Main Product Header */}
      <ProductHeader
        product={product}
        onSubscribeClick={() => setIsSubscribeOpen(true)}
      />

      {/* Real-Life Problem & Privacy Violation Spotlight */}
      <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#894DEF] uppercase tracking-wider font-semibold">
          <span className="w-2 h-2 rounded-none bg-[#894DEF]" />
          <span>Real-Life Crisis Solved: Privacy & Data Exploitation</span>
        </div>
        <h3 className="text-lg font-bold text-[#FAFAFA]">
          {product.privacy_problem}
        </h3>
        <p className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed max-w-3xl">
          Centralized SaaS platforms and public AI models log queries, retain confidential IP, and expose unencrypted user data to third-party data brokers and regulatory subpoenas.
          <strong className="text-[#FAFAFA] block mt-1">
            Pandem isolates execution within hardware-attested confidential TEE enclaves. Data self-destructs post-inference.
          </strong>
        </p>
      </div>

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
}
