"use client";

import React from "react";
import { Card, Badge } from "../../../ui";
import { Check, X, Shield, Lock, UserCheck, Users } from "lucide-react";

interface RolePermission {
  role: string;
  icon: React.ReactNode;
  badge: string;
  can: string[];
  cannot: string[];
}

const ROLES: RolePermission[] = [
  {
    role: "Contract Owner (Pandem Deployer)",
    icon: <Lock className="w-4 h-4 text-spectr-warning" />,
    badge: "Restricted Administrative Scope",
    can: [
      "Register new products in catalog (register_product)",
      "Withdraw accumulated 2.5% protocol fees (withdraw_fees) to treasury",
      "Deploy reproducible contract upgrades (tracked via code_hash)",
    ],
    cannot: [
      "Cannot withdraw subscriber escrow funds (no such method exists in WASM bytecode)",
      "Cannot alter agreement pricing or periods retroactively",
      "Cannot pause, confiscate, or veto subscriber refunds",
      "Cannot touch the 30% ops reserve or 20% contingency reserve",
    ],
  },
  {
    role: "Product Steward (Software Maker)",
    icon: <Shield className="w-4 h-4 text-spectr-primary" />,
    badge: "Service Operator Scope",
    can: [
      "Approve registered listings (approve_product)",
      "Receive 47.5% steward share ONLY after on-chain heartbeat verification",
      "Trigger killswitch (abandon_product), which instantly unlocks refunds for all users",
    ],
    cannot: [
      "Cannot withdraw subscriber escrow ahead of period release",
      "Cannot receive funds if service lapses heartbeat SLA",
      "Cannot prevent subscribers from cancelling or claiming refunds",
      "Cannot divert 30% ops compute budget away from verified agent tasks",
    ],
  },
  {
    role: "Subscriber (User Wallet)",
    icon: <UserCheck className="w-4 h-4 text-spectr-success" />,
    badge: "Full Autonomous Ownership",
    can: [
      "Cancel anytime (cancel): instant refund of all future unreleased periods",
      "Claim 100% refund (claim_refund) if heartbeat SLA is breached or maker abandons",
      "Upgrade tier (upgrade) with prorated pricing delta",
      "Renew subscription periods (renew) on demand",
    ],
    cannot: [
      "Cannot withdraw funds from another user's agreement",
      "Cannot access unreleased periods before cancellation or SLA breach",
    ],
  },
  {
    role: "Public / Autonomous Keepers (Anyone)",
    icon: <Users className="w-4 h-4 text-spectr-body" />,
    badge: "Permissionless Execution",
    can: [
      "Trigger release_period(agreement_id) once heartbeat is cryptographically attested",
      "Trigger claim_refund(agreement_id) for any lapsed agreement to protect users",
      "Read all agreement and escrow states via open NEAR RPC",
    ],
    cannot: [
      "Cannot redirect payout destination addresses",
      "Cannot alter split proportions or fee percentages",
    ],
  },
];

export const PermissionMatrix: React.FC = () => {
  return (
    <Card className="p-6 bg-spectr-surface border-spectr-hairline space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-spectr-ink tracking-tight font-sans">
              5. Permission Boundaries & Security Invariants
            </h3>
            <Badge variant="outline" className="font-mono text-xs">
              Verified in Rust Source
            </Badge>
          </div>
          <p className="text-xs text-spectr-muted font-mono mt-1">
            Audited against <code className="text-spectr-primary">contracts/escrow/src/lib.rs:789</code> (zero backdoor guarantees)
          </p>
        </div>

        <span className="text-xs font-mono text-spectr-success font-semibold px-2.5 py-1 bg-spectr-canvas border border-spectr-hairline">
          Enforced By Sandbox WASM
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((r) => (
          <div
            key={r.role}
            className="p-4 bg-spectr-canvas border border-spectr-hairline space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-spectr-hairline/60">
              <div className="flex items-center gap-2 font-bold text-spectr-ink font-sans text-sm">
                {r.icon}
                <span>{r.role}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {r.badge}
              </Badge>
            </div>

            {/* Allowed Actions */}
            <div className="space-y-1.5">
              <span className="text-spectr-success uppercase font-semibold text-xs block">
                ✓ What They CAN Do:
              </span>
              <ul className="space-y-1 text-spectr-body">
                {r.can.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-spectr-success shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prohibited Actions */}
            <div className="space-y-1.5 pt-2 border-t border-spectr-hairline/40">
              <span className="text-spectr-danger uppercase font-semibold text-xs block">
                ✗ What They CANNOT Do (Bytecode Guarantee):
              </span>
              <ul className="space-y-1 text-spectr-muted">
                {r.cannot.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <X className="w-3.5 h-3.5 text-spectr-danger shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
