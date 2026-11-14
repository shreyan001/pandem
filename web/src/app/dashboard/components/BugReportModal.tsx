"use client";

import React, { useState } from "react";
import { ENRICHED_PRODUCTS, BugReport } from "@pandem/shared";
import { Modal, Button, Input, Textarea } from "../../../ui";

export interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBug: (bug: BugReport) => void;
  targetAccount: string;
  initialProductSlug?: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitBug,
  targetAccount,
  initialProductSlug = "aegis-legal",
}) => {
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>(initialProductSlug);
  const [bugTitle, setBugTitle] = useState<string>("");
  const [bugSeverity, setBugSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [bugDescription, setBugDescription] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDescription.trim()) return;

    const matchedProduct =
      ENRICHED_PRODUCTS.find((p) => p.slug === selectedProductSlug) ||
      ENRICHED_PRODUCTS[0];

    const newBug: BugReport = {
      id: `bug-${Date.now()}`,
      product_id: matchedProduct.product_id,
      title: bugTitle.trim(),
      severity: bugSeverity,
      description: bugDescription.trim(),
      status: "Investigating",
      warranty_reserve_hold_usd: "$1,850 locked",
      submitted_by: targetAccount,
      submitted_at: "Just now",
      sla_hours_remaining: 168,
    };

    onSubmitBug(newBug);
    setBugTitle("");
    setBugDescription("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Solve-to-Pay Bug Bounty"
      description="100% Free for Subscribers • Holds 7% Warranty Pool"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="space-y-1.5 font-sans">
          <label className="block text-xs font-semibold text-spectr-ink uppercase tracking-wide">
            Subscribed Product
          </label>
          <select
            value={selectedProductSlug}
            onChange={(e) => setSelectedProductSlug(e.target.value)}
            className="w-full bg-spectr-canvas border border-spectr-hairline text-spectr-ink p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-spectr-primary text-xs font-mono"
          >
            {ENRICHED_PRODUCTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.suite})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Bug Title / Incident *"
          required
          placeholder="e.g. Remote attestation latency timeout during heavy workload"
          value={bugTitle}
          onChange={(e) => setBugTitle(e.target.value)}
          mono
        />

        <div className="space-y-1.5 font-sans">
          <label className="block text-xs font-semibold text-spectr-ink uppercase tracking-wide">
            Severity Level
          </label>
          <select
            value={bugSeverity}
            onChange={(e) => setBugSeverity(e.target.value as any)}
            className="w-full bg-spectr-canvas border border-spectr-hairline text-spectr-ink p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-spectr-primary text-xs font-mono"
          >
            <option value="Low">Low (Cosmetic / Typo)</option>
            <option value="Medium">Medium (Non-critical performance degradation)</option>
            <option value="High">High (Heartbeat latency / intermittent failure)</option>
            <option value="Critical">Critical (Security flaw / Service outage)</option>
          </select>
        </div>

        <Textarea
          label="Reproduction Steps & Logs *"
          required
          rows={4}
          placeholder="Provide detailed reproduction steps, query parameters, or transaction hashes..."
          value={bugDescription}
          onChange={(e) => setBugDescription(e.target.value)}
          mono
        />

        <div className="p-3 bg-spectr-canvas rounded-none border border-spectr-hairline text-xs text-spectr-body space-y-1">
          <div className="flex justify-between">
            <span>Reporter:</span>
            <span className="text-spectr-ink font-semibold">{targetAccount}</span>
          </div>
          <div className="flex justify-between">
            <span>Warranty Hold Duration:</span>
            <span className="text-spectr-warning">7 Days Release Interval</span>
          </div>
          <div className="flex justify-between">
            <span>Filing Cost:</span>
            <span className="text-spectr-primary font-bold">0 tUSDC (Free)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            Submit Bug Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
