"use client";

import React, { useState } from "react";
import { SubscriberProposal } from "@pandem/shared";

interface SubscriberRequestsCardProps {
  proposals: SubscriberProposal[];
  productId: number;
}

export function SubscriberRequestsCard({ proposals: initialProposals, productId }: SubscriberRequestsCardProps) {
  const [proposals, setProposals] = useState<SubscriberProposal[]>(initialProposals);
  const [userTokens, setUserTokens] = useState<number>(3); // 3 request tokens per month
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleVoteToken = (proposalId: string) => {
    if (userTokens <= 0) {
      setFeedbackMsg("You have consumed all 3 Request Tokens for this billing period.");
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    setUserTokens((prev) => prev - 1);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, tokens_allocated: p.tokens_allocated + 1 } : p))
    );
    setFeedbackMsg("Allocated 1 Request Token to signal subscriber demand!");
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (userTokens <= 0) {
      setFeedbackMsg("You need at least 1 Request Token to submit a proposal.");
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newProp: SubscriberProposal = {
      id: `prop-${Date.now()}`,
      product_id: productId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      tokens_allocated: 1,
      author: "you.testnet",
      created_at: "Just now",
      status: "Open",
    };

    setUserTokens((prev) => prev - 1);
    setProposals([newProp, ...proposals]);
    setNewTitle("");
    setNewDesc("");
    setIsModalOpen(false);
    setFeedbackMsg("Proposal submitted! 1 Request Token consumed.");
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Subscriber Requests & Demand Signaling</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              3 Tokens / Month
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Subscribers steer product roadmaps by allocating request tokens to feature proposals.
          </p>
        </div>

        {/* User Token Balance */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Your Balance: </span>
            <strong className="text-cyan-400 font-bold">{userTokens} Tokens</strong>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-medium transition-colors border border-zinc-700"
          >
            + Open Proposal
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          {feedbackMsg}
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-zinc-500">
            No subscriber requests open yet. Be the first to open a proposal!
          </div>
        ) : (
          proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start justify-between gap-4 hover:border-zinc-700/80 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">{prop.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.2 rounded border ${
                      prop.status === "Accepted"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : prop.status === "In_Review"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{prop.description}</p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-1">
                  <span>Author: {prop.author}</span>
                  <span>•</span>
                  <span>{prop.created_at}</span>
                </div>
              </div>

              {/* Vote / Allocate Token button */}
              <button
                onClick={() => handleVoteToken(prop.id)}
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 transition-all text-xs font-mono group"
                title="Allocate 1 Request Token to prioritize this proposal"
              >
                <span className="text-zinc-500 group-hover:text-cyan-400 transition-colors">▲</span>
                <span className="font-bold text-white group-hover:text-cyan-300">{prop.tokens_allocated}</span>
                <span className="text-[9px] text-zinc-500">tokens</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal to Create Proposal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h4 className="text-base font-bold text-white">Create Subscriber Proposal</h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Opening a proposal consumes <strong className="text-cyan-400">1 Request Token</strong>. You currently have {userTokens} tokens remaining.
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Add client-side PII scrubbing in TEE"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Technical Details & Use Case</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe what feature or upgrade you need and why..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
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
                  disabled={userTokens <= 0}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold font-mono text-xs"
                >
                  Submit Proposal (1 Token)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
