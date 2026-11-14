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
    <div className="p-6 rounded-none bg-[#171717] border border-[#2E2E2E] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Subscriber Requests & Demand Signaling</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#262626] text-[#894DEF] border border-[#2E2E2E]">
              3 Tokens / Month
            </span>
          </h3>
          <p className="text-xs text-[#B8B8B8] mt-1">
            Subscribers steer product roadmaps by allocating request tokens to feature proposals.
          </p>
        </div>

        {/* User Token Balance */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs font-mono">
            <span className="text-[#6B6B6B]">Your Balance: </span>
            <strong className="text-[#894DEF] font-bold">{userTokens} Tokens</strong>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] font-mono text-xs font-semibold transition-colors border border-[#FAFAFA]"
          >
            + Open Proposal
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-none bg-[#262626] border border-[#894DEF] text-xs font-mono text-[#FAFAFA]">
          {feedbackMsg}
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-[#6B6B6B]">
            No subscriber requests open yet. Be the first to open a proposal!
          </div>
        ) : (
          proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] flex items-start justify-between gap-4 hover:border-[#894DEF] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#FAFAFA]">{prop.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-none border ${
                      prop.status === "Accepted"
                        ? "bg-[#262626] text-[#894DEF] border-[#894DEF]"
                        : prop.status === "In_Review"
                        ? "bg-[#262626] text-[#FAFAFA] border-[#2E2E2E]"
                        : "bg-[#171717] text-[#B8B8B8] border-[#2E2E2E]"
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <p className="text-xs text-[#B8B8B8] leading-relaxed">{prop.description}</p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-[#6B6B6B] pt-1">
                  <span>Author: {prop.author}</span>
                  <span>•</span>
                  <span>{prop.created_at}</span>
                </div>
              </div>

              {/* Vote / Allocate Token button */}
              <button
                onClick={() => handleVoteToken(prop.id)}
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 py-2.5 rounded-none bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors text-xs font-mono group"
                title="Allocate 1 Request Token to prioritize this proposal"
              >
                <span className="text-[#6B6B6B] group-hover:text-[#894DEF] transition-colors">▲</span>
                <span className="font-bold text-[#FAFAFA] group-hover:text-[#894DEF]">{prop.tokens_allocated}</span>
                <span className="text-[9px] text-[#6B6B6B]">tokens</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal to Create Proposal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
          <div className="w-full max-w-md p-6 rounded-none bg-[#171717] border border-[#2E2E2E] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E]">
              <h4 className="text-base font-bold text-[#FAFAFA]">Create Subscriber Proposal</h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#B8B8B8] hover:text-[#FAFAFA] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#B8B8B8]">
              Opening a proposal consumes <strong className="text-[#894DEF]">1 Request Token</strong>. You currently have {userTokens} tokens remaining.
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Add client-side PII scrubbing in TEE"
                  className="w-full px-3.5 py-2.5 rounded-none bg-[#0D0D0D] border border-[#2E2E2E] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#894DEF]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#B8B8B8] mb-1">Technical Details & Use Case</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe what feature or upgrade you need and why..."
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
                  disabled={userTokens <= 0}
                  className="px-4 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] disabled:opacity-50 text-[#FAFAFA] border border-[#FAFAFA] font-semibold font-mono text-xs"
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
