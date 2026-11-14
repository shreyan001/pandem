/**
 * Spectr Design System Tokens
 * Source of truth: design.md & docs/UPGRADE-V2.md §5
 *
 * Core philosophy:
 * - Rectilinear geometry: border-radius 0px (sharp corners everywhere, zero rounded classes).
 * - Stark dark contrast: Canvas #0D0D0D and Surface #171717 with hairline #2E2E2E borders.
 * - Electric purple: Primary #894DEF CTA anchor.
 * - Typography: Inter for UI/display, JetBrains Mono for hashes/code/tx/scores.
 */

export const SPECTR_TOKENS = {
  colors: {
    // Backgrounds
    canvas: "#0D0D0D",
    surface: "#171717",
    surfaceRaised: "#262626",

    // Borders & Dividers
    hairline: "#2E2E2E",
    border: "#2E2E2E",

    // Brand & Interactive
    primary: "#894DEF",
    primaryHover: "#A273F2",
    primaryMuted: "#894DEF26", // 15% opacity tint

    // Typography & Content
    ink: "#FAFAFA",
    body: "#B8B8B8",
    muted: "#737373",
    subtle: "#6B6B6B",

    // Semantic accents
    success: "#4ADE80",
    successBg: "#14532D66",
    successBorder: "#166534",

    warning: "#FBBF24",
    warningBg: "#78350F66",
    warningBorder: "#92400E",

    danger: "#EF4444",
    dangerBg: "#450A0A66",
    dangerBorder: "#7F1D1D",
  },
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  borders: {
    thin: "1px",
    medium: "2px",
  },
  radius: {
    none: "0px",
  },
} as const;

export type SpectrTokens = typeof SPECTR_TOKENS;
