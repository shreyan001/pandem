"use client";

import React, { useState } from "react";
import { Modal, Input, Button, Stat } from "../ui";
import { useNearWallet } from "../context/NearWalletContext";
import { PANDEM_TOKEN_ID } from "@pandem/shared";
import { Send, Check, ExternalLink } from "lucide-react";

interface SendUsdcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendUsdcModal: React.FC<SendUsdcModalProps> = ({ isOpen, onClose }) => {
  const { accountId, tokenBalance, sendTransfer } = useNearWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("Transfer via Pandem");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Convert raw 6-decimal units to float display
  const balanceUnits = BigInt(tokenBalance || "0");
  const formattedBalance = (() => {
    const whole = balanceUnits / 1000000n;
    const frac = (balanceUnits % 1000000n).toString().padStart(6, "0").slice(0, 2);
    return `${whole}.${frac}`;
  })();

  const handleSetMax = () => {
    const whole = balanceUnits / 1000000n;
    const frac = (balanceUnits % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
    setAmount(frac ? `${whole}.${frac}` : `${whole}`);
    setError(null);
  };

  const handleReset = () => {
    setRecipient("");
    setAmount("");
    setMemo("Transfer via Pandem");
    setError(null);
    setTxHash(null);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRecipient = recipient.trim();
    if (!cleanRecipient) {
      setError("Please specify a recipient NEAR account ID");
      return;
    }

    if (cleanRecipient === accountId) {
      setError("Cannot send tUSDC to your own account");
      return;
    }

    const cleanAmount = amount.trim();
    if (!cleanAmount || isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    // Parse amount to 6-decimal integer string
    let amountUnits: bigint;
    try {
      const parts = cleanAmount.split(".");
      const whole = BigInt(parts[0] || "0");
      const frac = (parts[1] || "").padEnd(6, "0").slice(0, 6);
      amountUnits = whole * 1000000n + BigInt(frac);
    } catch {
      setError("Invalid amount format");
      return;
    }

    if (amountUnits <= 0n) {
      setError("Transfer amount must be greater than zero");
      return;
    }

    if (amountUnits > balanceUnits) {
      setError(`Insufficient balance. You have ${formattedBalance} tUSDC available.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const hash = await sendTransfer(cleanRecipient, amountUnits.toString(), memo.trim() || undefined);
      if (hash) {
        setTxHash(hash);
      } else {
        setError("Transaction failed or was rejected in wallet.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to execute transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-spectr-primary" />
          <span>Send Test USDC</span>
        </div>
      }
      description="Transfer NEP-141 mock USDC tokens directly on NEAR Testnet."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Balance Stat Display */}
        <Stat
          label="Available Balance"
          value={`${formattedBalance} tUSDC`}
          hint={`Payer: ${accountId || "anonymous"}`}
          tone="primary"
        />

        {txHash ? (
          /* Success Receipt Card */
          <div className="p-4 bg-spectr-surface-raised border border-spectr-success space-y-3 font-mono">
            <div className="flex items-center gap-2 text-spectr-success font-bold text-sm">
              <Check className="w-4 h-4" />
              <span>Transfer Confirmed on NEAR Testnet!</span>
            </div>

            <div className="p-3 bg-spectr-surface border border-spectr-hairline text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-spectr-muted">Recipient:</span>
                <span className="text-spectr-ink font-semibold">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-spectr-muted">Amount Sent:</span>
                <span className="text-spectr-primary font-bold">{amount} tUSDC</span>
              </div>
              {memo && (
                <div className="flex justify-between">
                  <span className="text-spectr-muted">Memo:</span>
                  <span className="text-spectr-body">{memo}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-spectr-hairline">
                <span className="text-spectr-muted">Token Contract:</span>
                <span className="text-spectr-body truncate max-w-[200px]">{PANDEM_TOKEN_ID}</span>
              </div>
            </div>

            <div className="pt-1">
              <a
                href={`https://explorer.testnet.near.org/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-spectr-primary hover:text-spectr-primary-hover underline"
              >
                <span>View Transaction on NEAR Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1"
              >
                Send Another Transfer
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleModalClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Transfer Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Account Input */}
            <Input
              label="Recipient Account ID"
              placeholder="e.g. recipient.testnet"
              mono
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              helperText="NEAR Testnet named account or 64-character implicit address"
            />

            {/* Amount Input with Max Button */}
            <Input
              label="Amount (tUSDC)"
              placeholder="0.00"
              mono
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              rightAddon={
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="px-2 py-1 bg-spectr-surface-raised hover:bg-spectr-surface text-spectr-primary hover:text-spectr-primary-hover font-mono font-bold text-xs border border-spectr-hairline transition-colors"
                >
                  MAX
                </button>
              }
              helperText={`Balance: ${formattedBalance} tUSDC`}
            />

            {/* Memo Input */}
            <Input
              label="Transfer Memo (Optional)"
              placeholder="Transfer via Pandem"
              mono
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              helperText="Recorded on the token contract transfer receipt"
            />

            {/* Technical Verification Details */}
            <div className="p-3 bg-spectr-canvas border border-spectr-hairline text-xs font-mono space-y-1 text-spectr-body">
              <div className="flex justify-between">
                <span className="text-spectr-muted">Method:</span>
                <span className="text-spectr-ink">ft_transfer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-spectr-muted">Attached Deposit:</span>
                <span className="text-spectr-ink">1 yoctoNEAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-spectr-muted">Gas Allowance:</span>
                <span className="text-spectr-ink">50 TGas</span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-spectr-surface border border-spectr-danger text-spectr-danger text-xs font-mono">
                ⚠ {error}
              </div>
            )}

            {/* Submit / Cancel Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleModalClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!recipient.trim() || !amount.trim()}
              >
                Send tUSDC →
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
