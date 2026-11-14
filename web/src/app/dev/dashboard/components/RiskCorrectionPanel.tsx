"use client";

import React from "react";
import { ShieldAlert, Scale } from "lucide-react";
import { Badge, Button, Card } from "../../../../ui";

export interface RiskCorrectionProposal {
  id: string;
  title: string;
  reason: string;
  requestedReleasePct: string;
  forPct: number;
  againstPct: number;
  quorumPct: number;
  status: "Voting_Open" | "Passed" | "Rejected";
  hoursRemaining?: number;
}

export interface RiskCorrectionPanelProps {
  riskProposals: RiskCorrectionProposal[];
  onOpenRiskModal: () => void;
}

export const RiskCorrectionPanel: React.FC<RiskCorrectionPanelProps> = ({
  riskProposals,
  onOpenRiskModal,
}) => {
  return (
    <Card className="bg-spectr-surface border-spectr-hairline p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-spectr-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-spectr-warning" />
            <h2 className="text-base font-semibold text-spectr-ink tracking-tight font-sans">
              Risk Correction & Community Voting Panel
            </h2>
          </div>
          <p className="text-xs text-spectr-body font-mono mt-0.5">
            Arbitrate maintenance downtime and dispute releases through subscriber request-token consensus.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpenRiskModal}
          leftIcon={<Scale className="w-3.5 h-3.5 text-spectr-primary" />}
        >
          Submit Risk Correction Proposal
        </Button>
      </div>

      {/* Proposals List */}
      <div className="space-y-3 font-mono text-xs">
        {riskProposals.map((prop) => (
          <div
            key={prop.id}
            className="p-5 bg-spectr-canvas border border-spectr-hairline space-y-3 rounded-none"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-spectr-primary font-bold">#{prop.id}</span>
                  <span className="text-spectr-ink font-medium font-sans">{prop.title}</span>
                  <Badge variant="category">off-chain</Badge>
                  <Badge variant={prop.status === "Voting_Open" ? "warning" : "success"}>
                    {prop.status === "Voting_Open"
                      ? `Voting Open (${prop.hoursRemaining}h remaining)`
                      : "Passed & Executed"}
                  </Badge>
                </div>
                <p className="text-xs text-spectr-body leading-relaxed max-w-3xl font-sans">
                  {prop.reason}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-spectr-muted block uppercase tracking-wider">
                  Requested Allocation
                </span>
                <span className="text-spectr-ink font-semibold">{prop.requestedReleasePct}</span>
              </div>
            </div>

            {/* Vote Tally Bar */}
            <div className="space-y-1.5 pt-2 border-t border-spectr-hairline text-xs">
              <div className="flex justify-between text-spectr-muted tabular-nums">
                <span>Vote Outcome: {prop.forPct}% In Favor · {prop.againstPct}% Against</span>
                <span>Quorum: {prop.quorumPct}% (50% Required)</span>
              </div>
              <div className="h-2 w-full bg-spectr-surface overflow-hidden flex rounded-none">
                <div
                  className="h-full bg-spectr-success rounded-none"
                  style={{ width: `${prop.forPct}%` }}
                  title="In Favor"
                />
                <div
                  className="h-full bg-spectr-danger rounded-none"
                  style={{ width: `${prop.againstPct}%` }}
                  title="Against"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
