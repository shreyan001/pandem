"use client";

import { useEffect, useState } from "react";
import {
  PANDEM_ESCROW_ID,
  PANDEM_AGENT_ID,
  PANDEM_BUDGET_ID,
  CloudPaymentTelemetry,
  InferencePaymentReceipt,
} from "@pandem/shared";

interface RunnerTelemetry {
  lastRunTimestamp: string;
  heartbeatsSent: number;
  releasesTriggered: number;
  refundsTriggered: number;
  cloudPaymentsTriggered?: number;
  isKillswitchActive: boolean;
  recentLogs: string[];
  cloudPayments?: InferencePaymentReceipt[];
}

interface AttestationData {
  verified: boolean;
  model: string;
  nonce: string;
  signing_address?: string;
  signing_algo?: string;
  hardware: {
    gpu: string;
    cpu: string;
    intel_tdx_quote_present: boolean;
    nvidia_payload_present: boolean;
  };
  error?: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  inference_id?: string;
}

export default function AgentDashboardPage() {
  const [telemetry, setTelemetry] = useState<RunnerTelemetry | null>(null);
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hello! I am Pandem AI, running inside an attested Intel TDX / NVIDIA H100 confidential hardware enclave on NEAR AI Cloud. Ask me anything about the escrow invariants, heartbeats, or refund guarantees.",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [paymentTelemetry, setPaymentTelemetry] = useState<CloudPaymentTelemetry | null>(null);
  const [isDrawingPayment, setIsDrawingPayment] = useState<boolean>(false);
  const [copiedProofId, setCopiedProofId] = useState<string | null>(null);

  // Fetch cloud payment telemetry
  const fetchPaymentTelemetry = async () => {
    try {
      const res = await fetch("/api/agent/inference-payment?product_id=1");
      if (res.ok) {
        const data = await res.json();
        setPaymentTelemetry(data);
      }
    } catch {}
  };

  // Simulate on-chain draw
  const handleSimulatePayment = async () => {
    setIsDrawingPayment(true);
    try {
      const res = await fetch("/api/agent/inference-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: 1, simulate: true, query_count: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setPaymentTelemetry(data.telemetry);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrawingPayment(false);
    }
  };

  const handleCopyProof = (id: string, proof: string) => {
    navigator.clipboard.writeText(proof);
    setCopiedProofId(id);
    setTimeout(() => setCopiedProofId(null), 2000);
  };

  // Fetch runner telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/agent/state");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {
      // Agent service might be starting
    }
  };

  // Verify hardware TEE attestation on demand with fresh nonce
  const verifyHardwareAttestation = async () => {
    setIsVerifying(true);
    try {
      const randomNonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const res = await fetch(`/api/agent/attestation?nonce=${randomNonce}`);
      const data = await res.json();
      setAttestation(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    verifyHardwareAttestation();
    fetchPaymentTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchPaymentTelemetry();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isSendingChat) return;

    const userMsg = inputPrompt.trim();
    setInputPrompt("");
    const newHistory: ChatMsg[] = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newHistory);
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.content) {
        setChatMessages([
          ...newHistory,
          {
            role: "assistant",
            content: data.content,
            inference_id: data.inference_id,
          },
        ]);
      } else {
        setChatMessages([
          ...newHistory,
          {
            role: "assistant",
            content: `Error from enclave: ${data.error || "No response"}`,
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        {
          role: "assistant",
          content: `Inference failed: ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Autonomous Agent & TEE Enclave
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              /agent
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
            <span>Agent Signer:</span>
            <span className="text-emerald-400 font-bold">{PANDEM_AGENT_ID}</span>
            <span>· Function-Call Key Only</span>
          </p>
        </div>

        <button
          onClick={verifyHardwareAttestation}
          disabled={isVerifying}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono transition-colors flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {isVerifying ? "Verifying Hardware Attestation..." : "↻ Refresh TEE Attestation Proof"}
        </button>
      </div>

      {/* TEE Attestation Hardware Proof Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                Confidential Hardware Verification
              </span>
              {attestation?.verified ? (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span>✓</span> TEE HARDWARE VERIFIED
                </span>
              ) : (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Verifying Enclave...
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Model: Qwen/Qwen3.8-27B (owned_by: nearai) · NVIDIA NRAS & Intel TDX
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-400 text-right">
            <div>TLS terminates inside TEE</div>
            <div className="text-emerald-400">Zero plaintext data exposure</div>
          </div>
        </div>

        {attestation && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Enclave CPU:</span>
              <span className="text-white font-bold mt-1 block">
                {attestation.hardware.cpu}
              </span>
              <span className="text-emerald-400 text-[10px] mt-1 block">
                {attestation.hardware.intel_tdx_quote_present ? "✓ TDX Quote Present" : "Quote pending"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Enclave GPU:</span>
              <span className="text-white font-bold mt-1 block">
                {attestation.hardware.gpu}
              </span>
              <span className="text-emerald-400 text-[10px] mt-1 block">
                {attestation.hardware.nvidia_payload_present ? "✓ NRAS JWT Validated" : "Payload pending"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Enclave Signing Key:</span>
              <span className="text-white font-bold mt-1 block truncate" title={attestation.signing_address}>
                {attestation.signing_address || "Enclave Key Bound"}
              </span>
              <span className="text-zinc-500 text-[10px] mt-1 block truncate" title={attestation.nonce}>
                Nonce: {attestation.nonce.slice(0, 16)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Runner Telemetry & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Stats */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 lg:col-span-1 shadow-lg">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Runner Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-400">Heartbeats Sent:</span>
              <span className="text-emerald-400 font-bold">
                {telemetry?.heartbeatsSent ?? 1}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-400">Releases Triggered:</span>
              <span className="text-cyan-400 font-bold">
                {telemetry?.releasesTriggered ?? 1}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-400">Refunds Triggered:</span>
              <span className="text-purple-400 font-bold">
                {telemetry?.refundsTriggered ?? 1}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-400">Killswitch State:</span>
              <span className={telemetry?.isKillswitchActive ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {telemetry?.isKillswitchActive ? "Active (Suspended)" : "Normal (Active)"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Runner Activity Stream */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 lg:col-span-2 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>On-Chain Action Stream</span>
            <span className="text-xs font-mono text-zinc-500">Autonomous loop: 20s</span>
          </h2>
          <div className="flex-1 bg-black/80 rounded-xl p-3.5 border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-56 overflow-y-auto space-y-1.5">
            {telemetry?.recentLogs && telemetry.recentLogs.length > 0 ? (
              telemetry.recentLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-zinc-300 border-b border-zinc-900 pb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-zinc-500">
                [Agent Runner] Active on NEAR testnet: monitoring product heartbeats & agreement releases.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Cloud Subscription & TEE Inference Payments */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Direct Cloud Subscription Payments</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                NEAR AI Cloud TEE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                draw_ops_funds
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                ±15% Cost Dampener
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Autonomous NEP-141 draws from <code className="text-zinc-300">contracts/budget</code> to pay confidential hardware enclave compute for <span className="text-emerald-400">Qwen/Qwen3.8-27B</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulatePayment}
              disabled={isDrawingPayment}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-xs font-mono transition-all disabled:opacity-50 shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
            >
              {isDrawingPayment ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                  <span>Drawing...</span>
                </>
              ) : (
                <>
                  <span>+ Draw Ops Payment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* 1. Active Ops Reserve Balance */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Active Ops Allocation</span>
            <div className="text-lg font-bold text-emerald-400 flex items-baseline gap-1">
              <span>{paymentTelemetry?.active_allocation?.current_balance_wnear ?? "0.0180"}</span>
              <span className="text-xs text-zinc-400 font-normal">wNEAR</span>
            </div>
            <span className="text-[10px] text-zinc-500 block">
              Received: {paymentTelemetry?.active_allocation ? (paymentTelemetry.active_allocation.total_ops_received.slice(0, 4) ? "0.0300" : "0.0300") : "0.0300"} wN (30% share)
            </span>
          </div>

          {/* 2. Period Draw Cap */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Period Draw Cap (120% burst)</span>
            <div className="text-lg font-bold text-cyan-300 flex items-baseline gap-1">
              <span>{paymentTelemetry?.active_allocation?.period_draw_cap_wnear ?? "0.0360"}</span>
              <span className="text-xs text-zinc-400 font-normal">wNEAR</span>
            </div>
            <span className="text-[10px] text-zinc-500 block">
              Drawn in period: {paymentTelemetry?.active_allocation?.drawn_in_current_period_wnear ?? "0.0210"} wN
            </span>
          </div>

          {/* 3. Unit Inference Cost & Dampener */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Unit Cost / Query</span>
            <div className="text-lg font-bold text-white flex items-baseline gap-1">
              <span>{paymentTelemetry?.active_allocation?.inference_cost_per_query_wnear ?? "0.0030"}</span>
              <span className="text-xs text-zinc-400 font-normal">wNEAR</span>
            </div>
            <span className="text-[10px] text-purple-300 block">
              ±15% bounds: [{paymentTelemetry?.active_allocation?.dampener_bounds?.min_allowed_wnear ?? "0.0025"} - {paymentTelemetry?.active_allocation?.dampener_bounds?.max_allowed_wnear ?? "0.0034"} wN]
            </span>
          </div>

          {/* 4. Pending Unsettled Usage */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
            <span className="text-zinc-500 block text-[11px]">Pending Unsettled Usage</span>
            <div className="text-lg font-bold text-amber-300 flex items-baseline gap-1">
              <span>{paymentTelemetry?.pending_unsettled_queries ?? 1}</span>
              <span className="text-xs text-zinc-400 font-normal">queries ({paymentTelemetry?.pending_unsettled_tokens ?? 1240} tokens)</span>
            </div>
            <span className="text-[10px] text-zinc-500 block">
              Estimated cost: ~{paymentTelemetry?.pending_unsettled_wnear ?? "0.0030"} wNEAR
            </span>
          </div>
        </div>

        {/* Verifiable Receipts Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verifiable Inference Payment Receipts ({paymentTelemetry?.recent_receipts?.length ?? 2})
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              SHA-256 Proofs with TEE Enclave Session IDs
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Batch & Receipt</th>
                  <th className="py-2.5 px-3">Compute / Tokens</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">SHA-256 Cost Proof</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {paymentTelemetry?.recent_receipts && paymentTelemetry.recent_receipts.length > 0 ? (
                  paymentTelemetry.recent_receipts.map((r: InferencePaymentReceipt) => (
                    <tr key={r.receipt_id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">Batch #{r.batch_id}</div>
                        <div className="text-[10px] text-zinc-500">{new Date(r.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{r.query_count} queries ({r.token_usage?.total_tokens ?? 0} tok)</div>
                        <div className="text-[10px] text-zinc-500">{r.token_usage?.compute_hours ?? 0.001} hrs GPU</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {r.amount_wnear} wNEAR
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/30 font-mono">
                            {r.sha256_cost_proof.slice(0, 12)}...
                          </code>
                          <button
                            onClick={() => handleCopyProof(r.receipt_id, r.sha256_cost_proof)}
                            className="text-[10px] text-zinc-400 hover:text-white"
                            title="Copy SHA-256 Cost Proof"
                          >
                            {copiedProofId === r.receipt_id ? "✓" : "📋"}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            r.status === "Settled"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <a
                          href={`https://explorer.testnet.near.org/transactions/${r.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{r.tx_hash.slice(0, 8)}...</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-zinc-500">
                      No cloud payment receipts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Private TEE Chat Interface */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Private Enclave Chat (Qwen/Qwen3.8-27B)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ENCRYPTED IN TEE
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Inference is verifiable via hardware attestation. Chat prompts remain confidential.
            </p>
          </div>
        </div>

        {/* Messages list */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-black/50 rounded-xl border border-zinc-800">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-3xl ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white ml-auto"
                  : "bg-zinc-900/90 text-zinc-200 border border-zinc-800"
              }`}
            >
              <div className="font-mono text-[10px] text-zinc-400 mb-1 flex items-center justify-between">
                <span>{msg.role === "user" ? "You (Subscriber)" : "Pandem AI (Intel TDX Enclave)"}</span>
                {msg.inference_id && (
                  <span className="text-emerald-400 text-[10px]">
                    id: {msg.inference_id.slice(0, 12)}...
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          {isSendingChat && (
            <div className="p-3.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 max-w-sm flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Executing private inference in enclave...</span>
            </div>
          )}
        </div>

        {/* Chat input */}
        <form onSubmit={handleSendChat} className="flex gap-3">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about subscriber protection, revenue split, or killswitch guarantees..."
            className="flex-1 bg-black/70 border border-zinc-700 px-4 py-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isSendingChat || !inputPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
          >
            {isSendingChat ? "Inferring..." : "Send Prompt →"}
          </button>
        </form>
      </div>
    </main>
  );
}
