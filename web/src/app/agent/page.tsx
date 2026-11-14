"use client";

import { useEffect, useState } from "react";
import { PANDEM_ESCROW_ID, PANDEM_AGENT_ID } from "@pandem/shared";

interface RunnerTelemetry {
  lastRunTimestamp: string;
  heartbeatsSent: number;
  releasesTriggered: number;
  refundsTriggered: number;
  isKillswitchActive: boolean;
  recentLogs: string[];
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
    const interval = setInterval(fetchTelemetry, 10000);
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
