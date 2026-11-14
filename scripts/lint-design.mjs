// scripts/lint-design.mjs
import fs from "fs";
import path from "path";

console.log("=== Pandem Design System Linter (Spectr Design Lock) ===");

const TARGET_FILES = [
  "web/src/app/page.tsx",
  "web/src/app/products/[slug]/page.tsx",
  "web/src/app/dashboard/page.tsx",
  "web/src/app/dev/dashboard/page.tsx",
  "web/src/app/verify/page.tsx",
];

// Also check any child component files created under these directories
function findComponents(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory() && entry.name === "components") {
      const subEntries = fs.readdirSync(full);
      for (const f of subEntries) {
        if (f.endsWith(".tsx") || f.endsWith(".ts")) {
          files.push(path.join(full, f).replace(/\\/g, "/"));
        }
      }
    } else if (entry.isDirectory()) {
      files.push(...findComponents(full));
    }
  }
  return files;
}

const allCheckFiles = [...TARGET_FILES, ...findComponents("web/src/app")];
// Deduplicate
const uniqueFiles = [...new Set(allCheckFiles)].filter(f => fs.existsSync(f));

let errors = [];

// Off-palette Tailwind color prefixes to block
const OFF_PALETTE_REGEX = /(bg|text|border|ring)-(zinc|emerald|slate|gray|neutral|stone|indigo|violet|cyan|pink|teal|rose)-[0-9]+/g;
// Raw hex in classNames or JSX strings: e.g. bg-[#...], text-[#...]
const RAW_HEX_REGEX = /["'`][^"'`]*#([0-9a-fA-F]{3,8})[^"'`]*["'`]/g;
// Sub-12px font sizes: text-[9px], text-[10px], text-[11px], text-[8px]
const SUB_12PX_REGEX = /text-\[(?:[0-9]|1[0-1])px\]/g;
// Non-zero border radius: rounded-(sm|md|lg|xl|2xl|3xl|full)
const NON_ZERO_RADIUS_REGEX = /rounded-(sm|md|lg|xl|2xl|3xl|full)/g;

for (const file of uniqueFiles) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  // 1. Line count check: pages must be <= 400 lines
  if (file.endsWith("page.tsx") && lines.length > 400) {
    errors.push(`${file}: Page exceeds 400 lines (${lines.length} lines). Split into components.`);
  }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check off-palette colors
    const offPaletteMatches = line.match(OFF_PALETTE_REGEX);
    if (offPaletteMatches) {
      errors.push(`${file}:${lineNum}: Off-palette Tailwind color found: ${offPaletteMatches.join(", ")}`);
    }

    // Check raw hex in className strings
    if (line.includes("className")) {
      const hexMatches = line.match(/#[0-9a-fA-F]{3,8}/g);
      if (hexMatches) {
        errors.push(`${file}:${lineNum}: Raw hex color in className found: ${hexMatches.join(", ")}. Use spectr tokens.`);
      }
    }

    // Check sub-12px text
    const sub12Matches = line.match(SUB_12PX_REGEX);
    if (sub12Matches) {
      errors.push(`${file}:${lineNum}: Text size under 12px found: ${sub12Matches.join(", ")}. Minimum allowed is 12px (text-xs).`);
    }

    // Check non-zero radius
    const radiusMatches = line.match(NON_ZERO_RADIUS_REGEX);
    if (radiusMatches) {
      errors.push(`${file}:${lineNum}: Non-zero border radius found: ${radiusMatches.join(", ")}. Only rounded-none allowed.`);
    }
  });
}

if (errors.length > 0) {
  console.error(`\n❌ Design system linter failed with ${errors.length} error(s):\n`);
  errors.slice(0, 30).forEach(e => console.error("  • " + e));
  if (errors.length > 30) {
    console.error(`  ... and ${errors.length - 30} more errors.`);
  }
  process.exit(1);
} else {
  console.log(`\n✓ All ${uniqueFiles.length} screen files pass Spectr Design System checks!`);
  console.log("  - Zero raw hex values");
  console.log("  - Zero off-palette color classes");
  console.log("  - Zero sub-12px typography");
  console.log("  - Zero non-zero border radii");
  console.log("  - All pages strictly under 400 lines");
  process.exit(0);
}
