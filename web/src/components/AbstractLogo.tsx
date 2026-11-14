"use client";

import React from "react";

interface AbstractLogoProps {
  slug: string;
  name?: string;
  className?: string;
  size?: number;
}

export function AbstractLogo({ slug, name, className = "w-10 h-10", size = 40 }: AbstractLogoProps) {
  const normalizedSlug = slug.toLowerCase();

  // Render dedicated crisp monochrome abstract protocol diagram for each product
  const renderDiagram = () => {
    switch (normalizedSlug) {
      case "aegis-legal":
        // Shield + Cryptographic Intersection
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <path d="M24 4L8 10V22C8 32 15 40 24 44C33 40 40 32 40 22V10L24 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="22" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M24 18V26M20 22H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="24" cy="22" r="2" fill="currentColor" />
          </svg>
        );

      case "pulsemed-tee":
        // Hexagonal Enclave + ECG Heartbeat
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 24H18L21 16L25 32L29 20L31 24H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="1.5" fill="currentColor" />
          </svg>
        );

      case "chrono-executive":
        // High-precision Orbital Chrono Dial with Meridiens
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
            <path d="M24 10V24L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 24H6M42 24H38M24 6V10M24 38V42" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );

      case "ciphertax-ai":
        // Zero-Knowledge Proof Trinity Triangle & Balance Loops
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <polygon points="24,6 42,38 6,38" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="24" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="23" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" />
            <line x1="28" y1="23" x2="32" y2="28" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="32" x2="28" y2="32" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );

      case "sentience-agent":
        // Autonomous Neural Nexus & Attestation Orbit
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
            <circle cx="24" cy="8" r="2.5" fill="currentColor" />
            <circle cx="38" cy="24" r="2.5" fill="currentColor" />
            <circle cx="24" cy="40" r="2.5" fill="currentColor" />
            <circle cx="10" cy="24" r="2.5" fill="currentColor" />
            <path d="M24 16V10.5M32 24H35.5M24 32V37.5M16 24H12.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );

      case "searxng-tee":
      case "searxng":
        // Concentric Metasearch Radar Array
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <circle cx="21" cy="21" r="14" stroke="currentColor" strokeWidth="2" />
            <circle cx="21" cy="21" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="21" cy="21" r="3" fill="currentColor" />
            <line x1="31" y1="31" x2="43" y2="43" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M21 7V13M35 21H29M21 35V29M7 21H13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );

      case "zerovault":
      case "vaultwarden":
        // Multi-Party Iris Aperture & Secure Vault Lock
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <rect x="10" y="18" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 18V12C16 7.5 19.5 4 24 4C28.5 4 32 7.5 32 12V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M24 34V37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case "krypton-enclave":
        // Asymmetric Labyrinth & Forward Secrecy Egress
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <rect x="6" y="6" width="36" height="36" rx="6" stroke="currentColor" strokeWidth="2" />
            <path d="M14 14H34V22H20V30H34V34H14V14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="34" cy="34" r="2.5" fill="currentColor" />
          </svg>
        );

      case "open-webui":
      case "open-webui-tee":
        // Modular LLM Enclave Node Array
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="8" height="8" rx="1" fill="currentColor" />
            <rect x="26" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="26" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="26" y="26" width="8" height="8" rx="1" fill="currentColor" />
          </svg>
        );

      case "immich":
      case "immich-private":
        // Spatial Perceptual Hash Mesh
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <polygon points="24,6 40,16 40,32 24,42 8,32 8,16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="24,14 33,20 33,28 24,34 15,28 15,20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
          </svg>
        );

      case "synapse":
      case "synapse-tee":
        // Decentralized Federated Matrix Nodes
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <circle cx="24" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="36" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
            <line x1="22" y1="15" x2="14" y2="31" stroke="currentColor" strokeWidth="1.5" />
            <line x1="26" y1="15" x2="34" y2="31" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="34" x2="32" y2="34" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="24" cy="24" r="2" fill="currentColor" />
          </svg>
        );

      default:
        // Algorithmic Cryptographic Node (Universal fallback)
        return (
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-zinc-200">
            <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
            <path d="M24 8V12M24 36V40M8 24H12M36 24H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center p-2 rounded-none bg-[#171717] border border-[#2E2E2E] hover:border-[#894DEF] transition-colors ${className}`}
      style={{ width: size, height: size }}
      title={name || slug}
    >
      {renderDiagram()}
    </div>
  );
}
