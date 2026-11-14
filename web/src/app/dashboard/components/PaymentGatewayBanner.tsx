"use client";

import React from "react";
import { Badge, Button, Card } from "../../../ui";
import { OnboardedPaymentMethod } from "../../../components/UserPaymentOnboardingModal";

export interface PaymentGatewayBannerProps {
  activePaymentMethod: OnboardedPaymentMethod | null;
  onConfigureClick: () => void;
}

export const PaymentGatewayBanner: React.FC<PaymentGatewayBannerProps> = ({
  activePaymentMethod,
  onConfigureClick,
}) => {
  const getWalletDisplayName = () => {
    if (!activePaymentMethod) return "MetaMask / Base (ETH/USDC)";
    switch (activePaymentMethod.walletType) {
      case "google_passkey":
        return "Google Web3 Email (Passkey)";
      case "metamask_base":
        return "MetaMask / Base (USDC)";
      case "phantom_solana":
        return "Phantom / Solana";
      default:
        return "Native NEAR Wallet";
    }
  };

  return (
    <Card className="p-5 bg-spectr-surface border-spectr-hairline space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary">NEAR Intents Multi-Chain Gateway</Badge>
            <Badge variant="success">Pay with ANY Token → Settle in USDC</Badge>
          </div>
          <p className="text-xs sm:text-sm text-spectr-body leading-relaxed max-w-3xl">
            Fund SaaS subscriptions with <strong className="text-spectr-ink">ANY token (ETH, SOL, USDC, USDT)</strong> from Ethereum, Base, Solana, or Arbitrum.
            Decentralized solvers convert your payment into native USDC inside your non-custodial NEAR escrow contract.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-spectr-canvas border border-spectr-hairline text-right font-mono text-xs">
            <div className="text-xs text-spectr-muted uppercase tracking-wider">Active Payment Source</div>
            <div className="text-spectr-success font-bold text-xs mt-0.5">
              {getWalletDisplayName()}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onConfigureClick}
          >
            Configure →
          </Button>
        </div>
      </div>
    </Card>
  );
};
