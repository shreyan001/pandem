"use client";

import React, { useState } from "react";
import { BugReport, TreasuryBreakdown } from "@pandem/shared";

interface SubscriberBugCenterCardProps {
  bugReports: BugReport[];
  treasury: TreasuryBreakdown;
  productId: number;
}

export function SubscriberBugCenterCard({ bugReports: initialBugs, treasury, productId }: SubscriberBugCenterCardProps) {
  const [bugReports, setBugReports] = useState<BugReport[]>(initialBugs);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [description, setDescription] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newBug: BugReport = {
      id: `bug-${Date.now()}`,
      product_id: productId,
      title: title.trim(),
      severity,
      description: description.trim(),
      status: "Investigating",
      warranty_reserve_hold_usd: severity === "Critical" ? "$350.00" : "$120.00",
      submitted_by: "you.testnet",
      submitted_at: "Just now",
      sla_hours_remaining: severity === "Critical" ? 24 : 72,
    };

    setBugReports([newBug, ...bugReports]);
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
    setFeedback("Bug ticket filed! Held against the 7% smart contract warranty reserve.");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Subscriber Bug Reporting & Escrow Warranty</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              7% Reserve Gated
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bug reports are free for subscribers. Unresolved critical bugs hold the 7% treasury warranty with a 70-day dispute window.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-xs font-semibold border border-amber-500/30 transition-colors"
        >
          + File Free Bug Ticket
        </button>
      </div>

      {/* Warranty Reserve Banner */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <span className="text-zinc-400">Current Bug Warranty Pool (7% of Treasury):</span>
          <div className="text-sm font-bold text-amber-400">{treasury.bug_warranty_reserve_usd}</div>
        </div>
        <div className="space-y-0.5 sm:text-right">
          <span className="text-zinc-400">Mandatory Escrow Warranty Window:</span>
          <div className="text-sm font-bold text-white">{treasury.escrow_warranty_days} Days</div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
          {feedback}
        </div>
      )}

      {/* Bug Reports List */}
      <div className="space-y-3">
        {bugReports.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-zinc-500">
            No active bug reports filed. Service operating under full SLA compliance.
          </div>
        ) : (
          bugReports.map((bug) => (
            <div
              key={bug.id}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 hover:border-zinc-700/80 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      bug.severity === "Critical"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : bug.severity === "High"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {bug.severity}
                  </span>
                  <span className="text-sm font-semibold text-zinc-100">{bug.title}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500">Held:</span>
                  <span className="text-amber-400 font-bold">{bug.warranty_reserve_hold_usd}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{bug.description}</p>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                <span>By: {bug.submitted_by} • {bug.submitted_at}</span>
                <span className="text-zinc-400 font-semibold">
                  Status: <span className="text-emerald-400">{bug.status.replace("_", " ")}</span> (SLA: {bug.sla_hours_remaining}h)
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to File Free Bug */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h4 className="text-base font-bold text-white">File Subscriber Bug Ticket</h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Free for active subscribers. Filing a valid bug holds a portion of the 7% smart contract warranty reserve until resolved.
            </p>

            <form onSubmit={handleSubmitBug} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Low">Low (Cosmetic / Minor UI)</option>
                  <option value="Medium">Medium (Non-critical functional bug)</option>
                  <option value="High">High (Core feature degradation)</option>
                  <option value="Critical">Critical (Service down / TEE Attestation failure)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Issue Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Model inference timeout on 4k context tokens"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Reproduction Steps & Expected Behavior</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-mono text-xs hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs"
                >
                  File Ticket (Free)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
