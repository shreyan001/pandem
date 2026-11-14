"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNearWallet } from "../../../context/NearWalletContext";
import { Badge, Card, PageHeader } from "../../../ui";
import { AccessActiveView, ActiveSessionData, ActiveProductData } from "./components/AccessActiveView";
import { AccessLockedView, LockedProductInfo } from "./components/AccessLockedView";
import { AccessChallengeView, AgreementSummary, ChallengePayload } from "./components/AccessChallengeView";

interface AccessClientProps {
  slug: string;
}

export const AccessClient: React.FC<AccessClientProps> = ({ slug }) => {
  const { accountId, isConnected, connect, signNep413Message } = useNearWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<LockedProductInfo | null>(null);
  const [activeSession, setActiveSession] = useState<{
    session: ActiveSessionData;
    product: ActiveProductData;
    token: string;
  } | null>(null);

  const [challengeData, setChallengeData] = useState<{
    agreements: AgreementSummary[];
    challenge: ChallengePayload;
  } | null>(null);

  const [lockedReason, setLockedReason] = useState<
    "not_subscribed" | "cancelled_or_refunded" | "wallet_disconnected" | "expired"
  >("wallet_disconnected");

  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Check existing session token in sessionStorage or query
  const checkStoredSession = useCallback(async (): Promise<boolean> => {
    try {
      const urlToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
      const storedToken = urlToken || sessionStorage.getItem(`pandem_access_token_${slug}`);
      if (!storedToken) return false;

      const res = await fetch(`/api/access?slug=${slug}&token=${encodeURIComponent(storedToken)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.session && data.product) {
          sessionStorage.setItem(`pandem_access_token_${slug}`, storedToken);
          setActiveSession({
            session: {
              ...data.session,
              remainingDays: data.session.remainingDays || 30,
            },
            product: data.product,
            token: storedToken,
          });
          return true;
        }
      }
      sessionStorage.removeItem(`pandem_access_token_${slug}`);
      return false;
    } catch {
      return false;
    }
  }, [slug]);

  // 2. Fetch on-chain status & challenge
  const fetchAccessState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const hasStored = await checkStoredSession();
    if (hasStored) {
      setIsLoading(false);
      return;
    }

    try {
      const url = accountId
        ? `/api/access?slug=${slug}&accountId=${encodeURIComponent(accountId)}`
        : `/api/access?slug=${slug}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load product access state");
        setIsLoading(false);
        return;
      }

      setProduct(data.product);

      if (!accountId) {
        setLockedReason("wallet_disconnected");
        setChallengeData(null);
      } else if (data.hasActiveSubscription && Array.isArray(data.agreements) && data.agreements.length > 0) {
        setChallengeData({
          agreements: data.agreements,
          challenge: data.challenge,
        });
      } else {
        setLockedReason("not_subscribed");
        setChallengeData(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to communicate with access verification service");
    } finally {
      setIsLoading(false);
    }
  }, [slug, accountId, checkStoredSession]);

  useEffect(() => {
    fetchAccessState();
  }, [fetchAccessState]);

  // 3. Perform NEP-413 signing and verification
  const handleSignChallenge = async () => {
    if (!challengeData || !challengeData.agreements[0] || !accountId) return;

    try {
      setIsSigning(true);
      setError(null);

      const targetAgreement = challengeData.agreements[0];
      const challenge = challengeData.challenge;

      const messageObj = {
        product_id: challenge.productId,
        agreement_id: targetAgreement.agreementId,
        nonce: challenge.nonceHex,
        expiry: challenge.expiry,
      };

      const messageString = JSON.stringify(messageObj);
      const nonceBytes = new Uint8Array(challenge.nonceBytes);

      // Sign with wallet using NEP-413
      const signedOutcome = await signNep413Message({
        message: messageString,
        recipient: challenge.recipient,
        nonce: nonceBytes,
      });

      if (!signedOutcome) {
        throw new Error("Message signing was cancelled or unsupported by connected wallet");
      }

      // Verify signature on server route /api/access
      const verifyRes = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: signedOutcome.accountId,
          publicKey: signedOutcome.publicKey,
          signature: signedOutcome.signature,
          message: messageString,
          recipient: challenge.recipient,
          nonce: challenge.nonceBytes,
          slug,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "NEP-413 verification was rejected by server");
      }

      // Save token in sessionStorage
      if (verifyData.token) {
        sessionStorage.setItem(`pandem_access_token_${slug}`, verifyData.token);
      }

      setActiveSession({
        session: verifyData.session,
        product: verifyData.product,
        token: verifyData.token,
      });
      setChallengeData(null);
    } catch (err: any) {
      console.warn("NEP-413 sign/verify error:", err);
      setError(err?.message || "Failed to complete NEP-413 authentication");
    } finally {
      setIsSigning(false);
    }
  };

  // 4. Unlock with Private Client Secret
  const handleUnlockWithSecret = async (secret: string) => {
    try {
      setIsSigning(true);
      setError(null);

      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim(), slug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        throw new Error(data.error || "Invalid secret or no active private subscription found");
      }

      sessionStorage.setItem(`pandem_access_token_${slug}`, data.token);
      setActiveSession({
        session: data.session,
        product: data.product,
        token: data.token,
      });
      setChallengeData(null);
    } catch (err: any) {
      console.warn("Secret unlock error:", err);
      setError(err?.message || "Failed to unlock with private secret");
    } finally {
      setIsSigning(false);
    }
  };

  const handleClearSession = () => {
    sessionStorage.removeItem(`pandem_access_token_${slug}`);
    setActiveSession(null);
    fetchAccessState();
  };

  return (
    <div className="min-h-screen bg-spectr-canvas text-spectr-body font-sans py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-spectr-hairline">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link href="/" className="text-spectr-muted hover:text-spectr-ink transition-colors">
            Pandem
          </Link>
          <span className="text-spectr-muted">/</span>
          <Link href="/products" className="text-spectr-muted hover:text-spectr-ink transition-colors">
            Catalog
          </Link>
          <span className="text-spectr-muted">/</span>
          <span className="text-spectr-ink font-semibold">{slug}</span>
          <span className="text-spectr-muted">/</span>
          <span className="text-spectr-primary">access</span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && accountId ? (
            <Badge variant="default" className="font-mono">
              {accountId}
            </Badge>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="text-xs font-mono text-spectr-primary hover:underline"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`${product?.name || slug} Access Enclave`}
        description="Hardware-attested live endpoints and sandbox credentials secured by NEP-413 signature verification and on-chain escrow."
      />

      {/* Loading state */}
      {isLoading && (
        <Card className="p-12 bg-spectr-surface border-spectr-hairline text-center space-y-3">
          <div className="w-6 h-6 border-2 border-spectr-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-spectr-muted">
            Checking on-chain agreement state on escrow-d6-df23.test-pandem-alice-1.testnet...
          </p>
        </Card>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 bg-spectr-surface border border-spectr-danger text-spectr-danger text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Active Session View */}
      {!isLoading && activeSession && (
        <AccessActiveView
          session={activeSession.session}
          product={activeSession.product}
          token={activeSession.token}
          onClearSession={handleClearSession}
        />
      )}

      {/* Challenge Signing View */}
      {!isLoading && !activeSession && challengeData && accountId && (
        <AccessChallengeView
          slug={slug}
          productName={product?.name || slug}
          accountId={accountId}
          agreement={challengeData.agreements[0]}
          challenge={challengeData.challenge}
          onSignChallenge={handleSignChallenge}
          onUnlockWithSecret={handleUnlockWithSecret}
          isSigning={isSigning}
          error={error}
        />
      )}

      {/* Locked View */}
      {!isLoading && !activeSession && !challengeData && product && (
        <AccessLockedView
          product={product}
          accountId={accountId}
          onConnectWallet={connect}
          onUnlockWithSecret={handleUnlockWithSecret}
          isVerifyingSecret={isSigning}
          secretError={error}
          reason={lockedReason}
        />
      )}
    </div>
  );
};
