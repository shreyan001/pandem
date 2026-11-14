"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CatalogItem } from "@pandem/shared";
import catalogData from "../../../shared/catalog.json";
import { useNearWallet } from "../context/NearWalletContext";
import { ProductHuntLeaderboard } from "../components/ProductHuntLeaderboard";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { SubscribeModal } from "../components/SubscribeModal";
import { HeroPersonaLaunchpad } from "./components/HeroPersonaLaunchpad";
import { ContractEnclaveInspector } from "./components/ContractEnclaveInspector";
import { SecurityMatrixTable } from "./components/SecurityMatrixTable";
import { Badge, Input } from "../ui";

export default function Home() {
  const router = useRouter();
  const { accountId, isConnected } = useNearWallet();
  const [detailProduct, setDetailProduct] = useState<CatalogItem | null>(null);
  const [subscribeProduct, setSubscribeProduct] = useState<CatalogItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => catalogData as unknown as CatalogItem[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthlySimAmount, setMonthlySimAmount] = useState<number>(50);

  // Dynamic catalog fetch from API
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CatalogItem[] = data.map((item: any, idx: number) => {
            const monthlyPrice = item.tiers?.[0]?.price_monthly
              ? `$${(Number(item.tiers[0].price_monthly) / 1000000).toFixed(0)}/mo`
              : item.price_display || "$5.00/mo";
            return {
              id: String(item.id || item.slug || idx + 1),
              name: item.name,
              tagline: item.tagline,
              description: item.description,
              price_per_period: item.price_per_period || item.tiers?.[0]?.price_monthly || "5000000",
              price_display: monthlyPrice,
              period_seconds: item.period_seconds || 2592000,
              period_display: item.period_display || "30 days",
              grace_seconds: item.grace_seconds || 604800,
              grace_display: item.grace_display || "7 days",
              category: item.category || "Confidential AI",
              status: item.status || "Active",
              features: item.features || ["Intel TDX Hardware Enclave", "Confidential Intent Settlement", "KMS-Sealed DB"],
              upvotes: typeof item.upvotes === "number" ? item.upvotes : 100,
              rank: item.rank || idx + 1,
              isProductOfTheDay: idx === 0,
              steward: item.steward || item.developer?.steward_address || "developer.testnet",
              teeHardware: item.tee_hardware || item.teeHardware || "Intel TDX Enclave",
              teeModel: item.tee_model || item.teeModel || "DeepSeek V3 (671B)",
            };
          });
          setCatalog(mapped);
        }
      })
      .catch((err) => console.warn("Dynamic catalog load failed:", err));
  }, []);

  const handleSelectProduct = (product: CatalogItem) => {
    setDetailProduct(product);
  };

  const handleLaunchSubscribe = (product: CatalogItem) => {
    setDetailProduct(null);
    setSubscribeProduct(product);
  };

  const handleUserPathway = () => {
    if (isConnected) {
      router.push("/dashboard");
    } else {
      const el = document.getElementById("storefront");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleDeveloperPathway = () => {
    if (isConnected) {
      router.push("/dev/dashboard");
    } else {
      router.push("/dev/onboarding");
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-spectr-canvas text-spectr-ink font-sans">
      {/* 1. Compact Hero PageHeader Band */}
      <HeroPersonaLaunchpad
        isConnected={isConnected}
        accountId={accountId}
        onUserPathway={handleUserPathway}
        onDeveloperPathway={handleDeveloperPathway}
      />

      {/* 2. Storefront Directory (Above the fold!) */}
      <section id="storefront" className="space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
          <div>
            <h2 className="text-2xl font-bold text-spectr-ink tracking-tight font-sans">
              Storefront Directory
            </h2>
            <p className="text-xs text-spectr-body font-mono mt-0.5">
              Verified services running inside hardware enclaves with on-chain subscription escrow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-56 sm:w-64">
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftAddon={<Search className="w-3.5 h-3.5" aria-hidden="true" />}
                aria-label="Search services"
                className="py-1.5 text-xs min-h-[36px]"
              />
            </div>

            <Badge variant="default" className="whitespace-nowrap">
              {filteredCatalog.length} Enclaves Active
            </Badge>
          </div>
        </div>

        <ProductHuntLeaderboard
          products={filteredCatalog}
          onSelectProduct={handleSelectProduct}
        />
      </section>

      {/* 3. Hero Centerpiece: Contract & Enclave Inspector */}
      <ContractEnclaveInspector
        monthlySimAmount={monthlySimAmount}
        onMonthlySimChange={setMonthlySimAmount}
      />

      {/* 4. Architecture & Security Matrix */}
      <SecurityMatrixTable />

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          onSubscribe={handleLaunchSubscribe}
        />
      )}

      {/* Subscribe Execution Modal */}
      {subscribeProduct && (
        <SubscribeModal
          product={{
            id: subscribeProduct.id,
            name: subscribeProduct.name,
            price_per_period: subscribeProduct.price_per_period,
            period_display: subscribeProduct.period_display,
            grace_display: subscribeProduct.grace_display,
          }}
          onClose={() => setSubscribeProduct(null)}
        />
      )}
    </main>
  );
}
