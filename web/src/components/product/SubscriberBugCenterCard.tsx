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
    <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Subscriber Bug Reporting & Escrow Warranty</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
              7% Reserve Gated
            </span>
          </h3>
          <p className="text-xs text-[#B8B8B8] mt-1">
            Bug reports are free for subscribers. Active bugs hold the treasury warranty reserve across 7-day milestone review cycles.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-none bg-[#262626] hover:bg-[#171717] text-[#FAFAFA] font-mono text-xs font-semibold border border-[#2E2E2E] hover:border-[#894DEF] transition-colors"
        >
          + File Free Bug Ticket
        </button>
      </div>

      {/* Warranty Reserve Banner */}
      <div className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <span className="text-[#6B6B6B]">Current Bug Warranty Pool (7% of Treasury):</span>
          <div className="text-sm font-bold text-[#894DEF]">{treasury.bug_warranty_reserve_usd}</div>
        </div>
        <div className="space-y-0.5 sm:text-right">
          <span className="text-[#6B6B6B]">Mandatory Escrow Warranty Window:</span>
          <div className="text-sm font-bold text-[#FAFAFA]">{treasury.escrow_warranty_days} Days</div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-none bg-[#262626] border border-[#894DEF] text-xs font-mono text-[#FAFAFA]">
          {feedback}
        </div>
      )}

      {/* Bug Reports List */}
      <div className="space-y-3">
        {bugReports.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-[#6B6B6B]">
            No active bug reports filed. Service operating under full SLA compliance.
          </div>
        ) : (
          bugReports.map((bug) => (
            <div
              key={bug.id}
              className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] space-y-2 hover:border-[#894DEF] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-none border ${
                      bug.severity === "Critical"
                        ? "bg-[#262626] text-rose-400 border-rose-800"
                        : bug.severity === "High"
                        ? "bg-[#262626] text-[#A273F2] border-[#894DEF]"
                        : "bg-[#171717] text-[#B8B8B8] border-[#2E2E2E]"
                    }`}
                  >
                    {bug.severity}
                  </span>
                  <span className="text-sm font-semibold text-[#FAFAFA]">{bug.title}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#6B6B6B]">Held:</span>
                  <span className="text-[#894DEF] font-bold">{bug.warranty_reserve_hold_usd}</span>
                </div>
              </div>

              <p className="text-xs text-[#B8B8B8] leading-relaxed">{bug.description}</p>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6B] pt-2 border-t border-[#2E2E2E]">
                <span>By: {bug.submitted_by} • {bug.submitted_at}</span>
                <span className="text-[#B8B8B8] font-semibold">
                  Status: <span className="text-[#FAFAFA]">{bug.status.replace("_", " ")}</span> (SLA: {bug.sla_hours_remaining}h)
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to File Free Bug */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
          <div className="w-full max-w-md p-6 rounded-none bg-[#171717] border border-[#2E2E2E] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E]">
              <h4 className="text-base font-bold text-[#FAFAFA]">File Subscriber Bug Ticket</h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#B8B8B8] hover:text-[#FAFAFA] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#B8B8B8]">
              Free for active subscribers. Filing a valid bug holds a portion of the 7% smart contract warranty reserve until resolved.
            </p>

            <form onSubmit={handleSubmitBug} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#894DEF]"
                >
                  <option value="Low">Low (Cosmetic / Minor UI)</option>
                  <option value="Medium">Medium (Non-critical functional bug)</option>
                  <option value="High">High (Core feature degradation)</option>
                  <option value="Critical">Critical (Service down / TEE Attestation failure)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Issue Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Model inference timeout on 4k context tokens"
                  className="w-full px-3.5 py-2.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#894DEF]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Reproduction Steps & Expected Behavior</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#894DEF] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-none bg-[#0D0D0D] text-[#B8B8B8] hover:text-[#FAFAFA] font-mono text-xs border border-[#2E2E2E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold font-mono text-xs"
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
