"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Textarea } from "../../../../ui";
import { RiskCorrectionProposal } from "./RiskCorrectionPanel";

export interface RiskProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal: (proposal: RiskCorrectionProposal) => void;
  existingProposalsCount: number;
}

export const RiskProposalModal: React.FC<RiskProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmitProposal,
  existingProposalsCount,
}) => {
  const [riskTitle, setRiskTitle] = useState<string>("");
  const [riskReason, setRiskReason] = useState<string>("");
  const [riskPct, setRiskPct] = useState<string>("20");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim() || !riskReason.trim()) return;

    const newProposal: RiskCorrectionProposal = {
      id: `RC-0${existingProposalsCount + 3}`,
      title: riskTitle.trim(),
      reason: riskReason.trim(),
      requestedReleasePct: `${riskPct}% Release`,
      forPct: 100,
      againstPct: 0,
      quorumPct: 12,
      status: "Voting_Open",
      hoursRemaining: 72,
    };

    onSubmitProposal(newProposal);
    setRiskTitle("");
    setRiskReason("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Risk Correction Proposal"
      description="Request maintenance consensus or dispute resolution from subscribers"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <Input
          label="Proposal Title"
          required
          value={riskTitle}
          onChange={(e) => setRiskTitle(e.target.value)}
          placeholder="e.g. 20% Partial Fee Release during CVM Host Migration"
          mono
        />

        <Textarea
          label="Technical Incident & Rationale"
          rows={4}
          required
          value={riskReason}
          onChange={(e) => setRiskReason(e.target.value)}
          placeholder="Document maintenance window, hardware attestation report status, and mitigation steps for subscribers..."
          mono
        />

        <div className="space-y-1.5 font-sans">
          <label className="block text-xs font-semibold text-spectr-ink uppercase tracking-wide">
            Requested Developer Fee Release (%)
          </label>
          <select
            value={riskPct}
            onChange={(e) => setRiskPct(e.target.value)}
            className="w-full bg-spectr-canvas border border-spectr-hairline p-2.5 text-spectr-ink text-xs rounded-none font-mono focus:outline-none focus:ring-1 focus:ring-spectr-primary"
          >
            <option value="10">10% Partial Period Release</option>
            <option value="20">20% Partial Period Release</option>
            <option value="30">30% Partial Period Release</option>
            <option value="50">50% Maintenance Grace Period Release</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-spectr-hairline">
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
            Submit to Subscriber Voting
          </Button>
        </div>
      </form>
    </Modal>
  );
};
