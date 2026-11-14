"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Badge, Card, CardHeader, CardTitle, CardContent, CardDescription, Stat } from "../../ui";

export interface ContractEnclaveInspectorProps {
  monthlySimAmount: number;
  onMonthlySimChange: (amount: number) => void;
}

export const ContractEnclaveInspector: React.FC<ContractEnclaveInspectorProps> = ({
  monthlySimAmount,
  onMonthlySimChange,
}) => {
  const [inspectorTab, setInspectorTab] = useState<"allocation" | "telemetry" | "settlement">("allocation");

  // Escrow split calculation
  const devShare = (monthlySimAmount * 0.475).toFixed(2);
  const opexShare = (monthlySimAmount * 0.3).toFixed(2);
  const shieldShare = (monthlySimAmount * 0.2).toFixed(2);
  const protocolShare = (monthlySimAmount * 0.025).toFixed(2);

  return (
    <div className="border border-spectr-hairline bg-spectr-surface rounded-none">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-spectr-surface-raised border-b border-spectr-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2 h-2 rounded-none bg-spectr-success" aria-hidden="true" />
          <span className="text-spectr-ink font-semibold">escrow.aegis-legal.testnet</span>
          <span className="text-spectr-hairline">|</span>
          <span className="text-spectr-muted">Active Escrow Contract</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setInspectorTab("allocation")}
            className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors ${
              inspectorTab === "allocation"
                ? "bg-spectr-canvas text-spectr-ink border border-spectr-hairline"
                : "text-spectr-muted hover:text-spectr-ink"
            }`}
          >
            Revenue Allocation
          </button>

          <button
            type="button"
            onClick={() => setInspectorTab("telemetry")}
            className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors ${
              inspectorTab === "telemetry"
                ? "bg-spectr-canvas text-spectr-ink border border-spectr-hairline"
                : "text-spectr-muted hover:text-spectr-ink"
            }`}
          >
            Hardware Attestation
          </button>

          <button
            type="button"
            onClick={() => setInspectorTab("settlement")}
            className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors ${
              inspectorTab === "settlement"
                ? "bg-spectr-canvas text-spectr-ink border border-spectr-hairline"
                : "text-spectr-muted hover:text-spectr-ink"
            }`}
          >
            Settlement Routing
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="p-6 sm:p-8">
        {inspectorTab === "allocation" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-spectr-hairline">
              <div>
                <h3 className="text-sm font-semibold text-spectr-ink font-sans">
                  Autonomous Split & Compute Outflow
                </h3>
                <p className="text-xs text-spectr-body font-mono mt-0.5">
                  Payments distribute automatically on release without developer custody.
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-xs text-spectr-muted">Monthly Fee:</span>
                <span className="text-sm font-semibold text-spectr-ink tabular-nums">
                  ${monthlySimAmount} USDC
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={monthlySimAmount}
                onChange={(e) => onMonthlySimChange(Number(e.target.value))}
                className="w-full accent-spectr-primary bg-spectr-surface-raised h-1.5 cursor-pointer rounded-none"
                aria-label="Simulated Monthly Fee"
              />
              <div className="flex justify-between text-xs text-spectr-muted font-mono tabular-nums">
                <span>$10</span>
                <span>$100</span>
                <span>$200</span>
              </div>
            </div>

            {/* 4 Payout Columns using Stat primitive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <Stat
                label="Developer Share (47.5%)"
                value={`$${devShare}`}
                hint="Held in 7-day rolling timelock"
                tone="default"
              />
              <Stat
                label="Autonomous OpEx (30.0%)"
                value={`$${opexShare}`}
                hint="Direct stream to H100 & CVM"
                tone="primary"
              />
              <Stat
                label="Contingency Reserve (20.0%)"
                value={`$${shieldShare}`}
                hint="Automated refund guarantee pool"
                tone="success"
              />
              <Stat
                label="Protocol Reserve (2.5%)"
                value={`$${protocolShare}`}
                hint="Contract state maintenance"
                tone="default"
              />
            </div>

            {/* Provider Outflow Status */}
            <div className="p-4 bg-spectr-canvas border border-spectr-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
              <span className="font-medium text-spectr-ink">Direct Infrastructure Outflow:</span>
              <div className="flex flex-wrap items-center gap-4 text-spectr-body">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-spectr-success" aria-hidden="true" />
                  <span>cloud-api.near.ai (H100)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-spectr-success" aria-hidden="true" />
                  <span>dstack.phala.network (TDX CVM)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-spectr-success" aria-hidden="true" />
                  <span>lighthouse.storage (Filecoin x402)</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {inspectorTab === "telemetry" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-spectr-hairline">
              <h3 className="text-sm font-semibold text-spectr-ink font-sans">
                Hardware Measurement & Quote Verification
              </h3>
              <span className="text-xs text-spectr-success flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Quote Verified Active</span>
              </span>
            </div>

            <div className="bg-spectr-canvas p-4 font-mono text-xs space-y-2 overflow-x-auto border border-spectr-hairline rounded-none">
              <div className="text-spectr-muted">// Intel TDX Quote v4 Telemetry</div>
              <div><span className="text-spectr-primary">hardware_cpu:</span> <span className="text-spectr-ink">&quot;Intel Xeon Platinum 8488C (TDX Enabled)&quot;</span></div>
              <div><span className="text-spectr-primary">hardware_gpu:</span> <span className="text-spectr-ink">&quot;NVIDIA H100 SXM5 80GB (Confidential Compute Mode)&quot;</span></div>
              <div><span className="text-spectr-primary">mr_enclave:</span>   <span className="text-spectr-ink">&quot;0x9f83ea0182470fbe76a0c0e74f826315&quot;</span></div>
              <div><span className="text-spectr-primary">mr_signer:</span>    <span className="text-spectr-ink">&quot;0x44c8d371109a471b0294b30171a81230&quot;</span></div>
              <div><span className="text-spectr-primary">attestation:</span>  <span className="text-spectr-success">&quot;Signature Validated by Intel PCS and NVIDIA NRAS&quot;</span></div>
              <div><span className="text-spectr-primary">host_access:</span>  <span className="text-spectr-success">&quot;Hypervisor Ring -1 Memory Inspection Prohibited&quot;</span></div>
            </div>

            <p className="text-xs text-spectr-body leading-relaxed font-sans">
              Memory encryption keys are generated directly by the processor on boot. Cloud host operators and system administrators cannot inspect enclave RAM, extract encryption keys, or read customer session state.
            </p>
          </div>
        )}

        {inspectorTab === "settlement" && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-spectr-hairline">
              <h3 className="text-sm font-semibold text-spectr-ink font-sans">
                Confidential Intent Settlement
              </h3>
              <p className="text-xs text-spectr-body font-mono mt-0.5">
                Zero-knowledge balance routing protects subscriber identity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Shielded Intent Shard</CardTitle>
                  <CardDescription>
                    Transfers settle on NEAR Confidential Intents private shards. Token balances and transfer amounts remain concealed from public block explorers.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Blind Commitment Storage</CardTitle>
                  <CardDescription>
                    The escrow contract stores <code className="font-mono text-spectr-ink">sha256(secret + product_id)</code>. Account names are never associated with purchased tools.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Remote-Attested Login</CardTitle>
                  <CardDescription>
                    Your client proves ownership of the local secret directly to the Intel TDX enclave via RA-TLS, establishing a session without exposing your wallet.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
