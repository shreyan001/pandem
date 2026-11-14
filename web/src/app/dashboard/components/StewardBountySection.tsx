"use client";

import React from "react";
import { BugReport } from "@pandem/shared";
import { Badge, Button, Card, Stat } from "../../../ui";

export interface StewardBountySectionProps {
  bugReports: BugReport[];
  onOpenBugModal: () => void;
}

export const StewardBountySection: React.FC<StewardBountySectionProps> = ({
  bugReports,
  onOpenBugModal,
}) => {
  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-spectr-ink font-sans">
              Steward Bounty Program (Solve-to-Pay Bug Reporting)
            </h3>
            <Badge variant="warning">7% Warranty Reserve</Badge>
          </div>
          <p className="text-xs text-spectr-body mt-1 max-w-2xl leading-relaxed font-sans">
            Subscribers report bugs for free (0 tUSDC). Verified issues place a hold on the developer&apos;s 7% treasury warranty reserve for 70 days.
            Community stewards and developers earn bounties once cryptographic fixes pass testing.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onOpenBugModal}
          className="shrink-0"
        >
          + File Bug Bounty Report
        </Button>
      </div>

      {/* Bug Metrics Row using Stat primitive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat
          label="Bounty Warranty Reserve"
          value="7% of Treasury"
          hint="Held in NEAR Escrow Contract"
          tone="warning"
        />
        <Stat
          label="Dispute & Fix Window"
          value="70 Days"
          hint="Mandatory SLA review period"
          tone="default"
        />
        <Stat
          label="Subscriber Filing Cost"
          value="0 tUSDC"
          hint="100% Free for all active subscribers"
          tone="primary"
        />
      </div>

      {/* Active Bug Tickets List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-spectr-muted">
          Active Warranty Holds & Tickets ({bugReports.length})
        </h4>

        {bugReports.length === 0 ? (
          <div className="text-center py-6 text-xs font-mono text-spectr-muted">
            No active bug tickets filed. Services operating smoothly.
          </div>
        ) : (
          bugReports.map((bug) => (
            <div
              key={bug.id}
              className="p-4 bg-spectr-canvas border border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-spectr-ink">{bug.title}</span>
                  <Badge variant="category">off-chain</Badge>
                  <Badge
                    variant={
                      bug.severity === "Critical"
                        ? "danger"
                        : bug.severity === "High"
                        ? "warning"
                        : "default"
                    }
                  >
                    {bug.severity}
                  </Badge>
                  <span className="text-xs font-mono text-spectr-muted">
                    Status: {bug.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-spectr-body font-sans">{bug.description}</p>
              </div>

              <div className="text-left sm:text-right shrink-0 font-mono">
                <span className="text-xs text-spectr-warning font-bold block">
                  {bug.warranty_reserve_hold_usd}
                </span>
                <span className="text-xs text-spectr-muted">
                  SLA: {bug.sla_hours_remaining}h left
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
