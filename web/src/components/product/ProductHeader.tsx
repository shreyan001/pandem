"use client";

import React from "react";
import { EnrichedProduct } from "@pandem/shared";
import { AbstractLogo } from "../AbstractLogo";
import { Badge, Button, Card, Stat } from "../../ui";

interface ProductHeaderProps {
  product: EnrichedProduct;
  onSubscribeClick: () => void;
}

const KNOWN_COVERS: Record<string, string> = {
  "open-webui": "/covers/open-webui.png",
  "localai": "/covers/localai.png",
  "searxng": "/covers/searxng.png",
  "vaultwarden": "/covers/vaultwarden.png",
  "immich": "/covers/immich.png",
  "nextcloud": "/covers/nextcloud.png",
};

function getProductCover(slug?: string, id?: string): string | null {
  const s = (slug || id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  for (const key of Object.keys(KNOWN_COVERS)) {
    if (s.includes(key)) return KNOWN_COVERS[key];
  }
  return null;
}

export function ProductHeader({ product, onSubscribeClick }: ProductHeaderProps) {
  const coverUrl = getProductCover(product.slug, String(product.product_id));
  const displayPrice = product.tiers?.[0]?.price_monthly
    ? `$${(Number(product.tiers[0].price_monthly) / 1000000).toFixed(0)} tUSDC`
    : "5 tUSDC";

  return (
    <Card className="rounded-none bg-spectr-surface border-spectr-hairline overflow-hidden">
      {/* 16:9 Cover Plane with Inset AbstractLogo */}
      <div className="relative aspect-[16/9] max-h-72 w-full overflow-hidden bg-spectr-surface border-b border-spectr-hairline rounded-none">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center rounded-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-spectr-surface-raised via-spectr-surface to-spectr-canvas flex items-center justify-center rounded-none">
            <AbstractLogo slug={product.slug} name={product.name} size={64} />
          </div>
        )}

        {/* AbstractLogo (76px) inset on bottom-left of cover */}
        <div className="absolute bottom-4 left-6 z-10 p-1 bg-spectr-surface border border-spectr-hairline rounded-none shadow-2xl">
          <AbstractLogo
            slug={product.slug}
            name={product.name}
            size={76}
            className="w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>
      </div>

      {/* Header Content Body */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            {/* Category / Rank / TEE Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="category">{product.suite}</Badge>
              <Badge variant="default">Rank #{product.rank}</Badge>
              <Badge variant="primary">{product.tee_hardware}</Badge>
              <Badge variant="success" dot>
                {product.heartbeat_streak}-Period Liveness
              </Badge>
            </div>

            {/* Product Name (heading-lg) */}
            <h1 className="text-2xl sm:text-3xl font-bold text-spectr-ink tracking-tight font-sans">
              {product.name}
            </h1>

            {/* One-line Tagline */}
            <p className="text-xs sm:text-sm text-spectr-body font-sans max-w-2xl truncate">
              {product.tagline}
            </p>
          </div>

          {/* Right Column: Score & Heartbeat Stat + Primary Subscribe Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-spectr-canvas border border-spectr-hairline text-right font-mono text-xs rounded-none">
                <span className="text-xs text-spectr-muted uppercase block">Algorithmic Score</span>
                <span className="text-xl font-bold text-spectr-primary tabular-nums">
                  {product.score}/100
                </span>
              </div>

              <div className="p-3 bg-spectr-canvas border border-spectr-hairline text-right font-mono text-xs rounded-none">
                <span className="text-xs text-spectr-muted uppercase block">Heartbeat Proof</span>
                <span className="text-xl font-bold text-spectr-success tabular-nums">
                  {product.heartbeat_streak}d
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onSubscribeClick}
              className="w-full sm:w-auto font-mono text-xs"
            >
              Subscribe · {displayPrice}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
