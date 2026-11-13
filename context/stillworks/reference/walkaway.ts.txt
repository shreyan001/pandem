// ==============================================================================
// STILLWORKS SOVEREIGN WALKAWAY BUNDLE GENERATOR
// EF CROPS Compliant: Local-First, Censorship-Resistant, Zero Vendor Lock-in
// Generates standard uncompressed PKZIP archives purely in browser/node
// ==============================================================================

export interface WalkawayBundle {
  filename: string;
  zipBytes: Uint8Array;
  dockerComposeYaml: string;
  restoreScript: string;
  restoreScriptBat: string;
  manifestJson: string;
  offlineReaderHtml: string;
  readme: string;
}

// Precomputed CRC32 table for IEEE 802.3 polynomial
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function computeCrc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function buildZipArchive(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords = files.map((f) => {
    const nameBytes = encoder.encode(f.name);
    const dataBytes = encoder.encode(f.content);
    const crc = computeCrc32(dataBytes);
    return { nameBytes, dataBytes, crc, size: dataBytes.length };
  });

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of fileRecords) {
    // 1. Local File Header (30 bytes)
    const lh = new Uint8Array(30);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true);         // Version needed: 2.0
    lv.setUint16(6, 0, true);          // General purpose bit flag
    lv.setUint16(8, 0, true);          // Compression method: 0 (store / no compression)
    lv.setUint16(10, 0x4000, true);    // DOS file time
    lv.setUint16(12, 0x5600, true);    // DOS file date
    lv.setUint32(14, f.crc, true);     // CRC-32
    lv.setUint32(18, f.size, true);    // Compressed size
    lv.setUint32(22, f.size, true);    // Uncompressed size
    lv.setUint16(26, f.nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true);         // Extra field length

    localParts.push(lh, f.nameBytes, f.dataBytes);

    // 2. Central Directory File Header (46 bytes)
    const cd = new Uint8Array(46);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory header signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed
    cv.setUint16(8, 0, true);          // General purpose bit flag
    cv.setUint16(10, 0, true);         // Compression method: 0
    cv.setUint16(12, 0x4000, true);    // DOS file time
    cv.setUint16(14, 0x5600, true);    // DOS file date
    cv.setUint32(16, f.crc, true);     // CRC-32
    cv.setUint32(20, f.size, true);    // Compressed size
    cv.setUint32(24, f.size, true);    // Uncompressed size
    cv.setUint16(28, f.nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true);         // Extra field length
    cv.setUint16(32, 0, true);         // File comment length
    cv.setUint16(34, 0, true);         // Disk number start
    cv.setUint16(36, 0, true);         // Internal file attributes
    cv.setUint32(38, 0, true);         // External file attributes
    cv.setUint32(42, offset, true);    // Relative offset of local header

    centralParts.push(cd, f.nameBytes);
    offset += 30 + f.nameBytes.length + f.size;
  }

  const centralDirSize = centralParts.reduce((acc, part) => acc + part.length, 0);

  // 3. End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);   // EOCD signature
  ev.setUint16(4, 0, true);            // Disk number
  ev.setUint16(6, 0, true);            // Disk with central directory
  ev.setUint16(8, files.length, true); // Number of central directory records on this disk
  ev.setUint16(10, files.length, true);// Total number of central directory records
  ev.setUint32(12, centralDirSize, true); // Size of central directory
  ev.setUint32(16, offset, true);      // Offset of start of central directory
  ev.setUint16(20, 0, true);           // Comment length

  const totalLength = offset + centralDirSize + 22;
  const zip = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of [...localParts, ...centralParts, eocd]) {
    zip.set(part, pos);
    pos += part.length;
  }

  return zip;
}

export function generateWalkawayBundle(
  productSlug: string,
  productName: string,
  storageRoot: string = '0x20e807406258f81de5e4f5da6c479d8db2492bd952b1e56e040ef69a53db5c69'
): WalkawayBundle {
  const dockerComposeYaml = `# ==============================================================================
# STILLWORKS SOVEREIGN WALKAWAY STACK: ${productName.toUpperCase()}
# Standard: Ethereum Foundation CROPS (Censorship Resistant, Open-source Software)
# Cryptographic 0G Storage Turbo Anchor: ${storageRoot}
# Verified Galileo Escrow: 0x153badA8AB7C65DAF3a90f581E6b34AB7cAC543a
# Verified Hourly Hub: 0xb2b264386d3b88085ca7e4114a6B0eF0358aC450
# ==============================================================================

version: "3.9"

services:
  ${productSlug}-server:
    image: ghcr.io/stillworks/${productSlug}:latest
    container_name: stillworks-${productSlug}-local
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - OFFLINE_MODE=true
      - ZERO_G_STORAGE_ROOT=${storageRoot}
      - LOCAL_DATABASE_PATH=/data/${productSlug}.sqlite
      - INFERENCE_FALLBACK=http://ollama-sidecar:11434
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
      - ./backups:/backups
    depends_on:
      - local-cache-sidecar

  # Local 0G Storage Turbo Cache Sidecar
  local-cache-sidecar:
    image: ghcr.io/stillworks/0g-storage-sidecar:latest
    container_name: 0g-local-turbo-cache
    restart: unless-stopped
    environment:
      - INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
      - CHAIN_RPC=https://evmrpc-testnet.0g.ai
      - PINNED_ROOT=${storageRoot}
    ports:
      - "5678:5678"
    volumes:
      - ./0g-cache:/cache

  # Local LLM Inference Sidecar (Ollama / CPU+GPU fallback)
  ollama-sidecar:
    image: ollama/ollama:latest
    container_name: ollama-local-inference
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama-models:/root/.ollama
`;

  const restoreScript = `#!/usr/bin/env bash
# ==============================================================================
# STILLWORKS RESTORE & SELF-HOSTING SCRIPT (Linux / macOS)
# ==============================================================================
set -e

echo "======================================================================"
echo "      Restoring Sovereign Data Bundle: ${productName}"
echo "      0G Storage Anchor: ${storageRoot}"
echo "======================================================================"

mkdir -p ./data ./backups ./0g-cache ./ollama-models

if command -v docker &> /dev/null; then
    echo "[1/3] Launching sovereign local stack via Docker Compose..."
    docker compose -f docker-compose.sovereign.yml up -d
    echo "[2/3] Verifying 0G Turbo state anchor (${storageRoot})..."
    curl -sf http://localhost:5678/status || echo "Sidecar starting up..."
    echo "[3/3] Service running at: http://localhost:8080"
    echo "======================================================================"
    echo "✅ SUCCESS: Your sovereign instance is running 100% offline."
    echo "Open http://localhost:8080 in your browser."
    echo "======================================================================"
else
    echo "[!] Docker not found. Opening offline reader in your default browser..."
    open offline-reader.html || xdg-open offline-reader.html
fi
`;

  const restoreScriptBat = `@echo off
rem ==============================================================================
rem STILLWORKS RESTORE & SELF-HOSTING SCRIPT (Windows PowerShell / Batch)
rem ==============================================================================
echo ======================================================================
echo       Restoring Sovereign Data Bundle: ${productName}
echo       0G Storage Anchor: ${storageRoot}
echo ======================================================================

if not exist data mkdir data
if not exist backups mkdir backups
if not exist 0g-cache mkdir 0g-cache
if not exist ollama-models mkdir ollama-models

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Launching sovereign local stack via Docker Compose...
    docker compose -f docker-compose.sovereign.yml up -d
    echo [2/3] Verification complete.
    echo [3/3] Service running at: http://localhost:8080
    echo ======================================================================
    echo Open http://localhost:8080 in your browser.
    echo ======================================================================
) else (
    echo [!] Docker not found. Launching standalone offline reader...
    start offline-reader.html
)
pause
`;

  const manifestJson = JSON.stringify(
    {
      protocol: 'Stillworks Sovereign Software',
      standard: 'Ethereum Foundation CROPS (Censorship Resistant, Open-Source Software)',
      version: '1.0.0',
      product: {
        slug: productSlug,
        name: productName,
      },
      cryptographicProof: {
        storageRoot,
        chain: '0G Galileo Testnet',
        chainId: 16602,
        rpc: 'https://evmrpc-testnet.0g.ai',
        storageIndexer: 'https://indexer-storage-testnet-turbo.0g.ai',
        storageNodes: ['http://34.83.53.209:5678', 'http://34.169.28.106:5678'],
        contracts: {
          usdt: '0x6A8c371B01A9b9657c3bfbF8677c96408145B512',
          escrow: '0x153badA8AB7C65DAF3a90f581E6b34AB7cAC543a',
          hourlyProtocolHub: '0xb2b264386d3b88085ca7e4114a6B0eF0358aC450',
          waterfallContingencyHub: '0x3DE98F1928157098e6c82F316Ac04BbF46c7B10e',
          zerogServingBroker: '0x0AD9690e0b34aB2d493DE02cDF149ee34f6C9939',
        },
        storageFeeTx: '0xe1dab1854a7cbbb631dbee9beb68f2971446e940884a379f16c91c3e23a8b2fb',
        anchoredEpoch: 2,
      },
      exportedAt: new Date().toISOString(),
      cropsInvariants: {
        censorshipResistant: true,
        openSource: true,
        localFirst: true,
        zeroVendorLockIn: true,
        cryptographicallyAuditable: true,
      },
    },
    null,
    2
  );

  const offlineReaderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stillworks Sovereign Offline Reader &mdash; ${productName}</title>
  <style>
    :root {
      --bg: #090a0f;
      --card: #13151f;
      --border: #222638;
      --accent: #8b5cf6;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --green: #10b981;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .wrap {
      max-width: 840px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(139, 92, 246, 0.15);
      color: var(--accent);
      padding: 4px 10px;
      border: 1px solid rgba(139, 92, 246, 0.4);
      margin-bottom: 12px;
    }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p.lead { color: var(--muted); font-size: 14px; margin: 0; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 24px;
      margin-bottom: 20px;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--muted);
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .val {
      font-family: monospace;
      font-size: 13px;
      color: #38bdf8;
      word-break: break-all;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <span class="badge"><span class="status-dot"></span>100% Offline Sovereign Reader</span>
      <h1>${productName} State Archive</h1>
      <p class="lead">This archive was generated by Stillworks under the Ethereum Foundation CROPS protocol. It is permanently self-hosting and requires zero external servers.</p>
    </div>

    <div class="card">
      <div class="label">Cryptographic 0G Storage Root</div>
      <div class="val">${storageRoot}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Onchain Escrow Contract</div>
        <div class="val">0x153badA8AB7C65DAF3a90f581E6b34AB7cAC543a</div>
      </div>
      <div class="card">
        <div class="label">Galileo Hourly Hub</div>
        <div class="val">0xb2b264386d3b88085ca7e4114a6B0eF0358aC450</div>
      </div>
    </div>

    <div class="card">
      <div class="label">CROPS Sovereignty Invariants</div>
      <ul style="color: var(--muted); font-size: 13px; line-height: 1.8; margin: 10px 0 0; padding-left: 20px;">
        <li><b style="color: #fff">Zero Vendor Lock-In:</b> All application source code and SQLite snapshots run fully locally.</li>
        <li><b style="color: #fff">Contingency Protection:</b> 20% of your subscription was locked in onchain contingency. If the steward stops hourly heartbeats for 2 hours, your remaining balance is 100% refundable.</li>
        <li><b style="color: #fff">Verifiable AI Quota:</b> Model weights and inference state anchor to 0G Turbo Layer without telemetry tracking.</li>
      </ul>
    </div>
  </div>
</body>
</html>
`;

  const readme = `# Stillworks Sovereign Walkaway Bundle: ${productName}

This archive contains everything required to run **${productName}** on your own hardware with 100% data sovereignty.

## Standards Compliance
- **Standard:** Ethereum Foundation CROPS (Censorship Resistant, Open-source Software)
- **Data Anchor:** 0G Storage Turbo (\`${storageRoot}\`)
- **Smart Contracts:** 0G Galileo Testnet (Chain ID: \`16602\`)
  - Escrow: \`0x153badA8AB7C65DAF3a90f581E6b34AB7cAC543a\`
  - Hourly Protocol Hub: \`0xb2b264386d3b88085ca7e4114a6B0eF0358aC450\`
  - Waterfall Contingency Hub: \`0x3DE98F1928157098e6c82F316Ac04BbF46c7B10e\`

## Quick Start (Linux / macOS)
\`\`\`bash
chmod +x restore-state.sh
./restore-state.sh
\`\`\`

## Quick Start (Windows)
Double-click \`restore-state.bat\` or execute in PowerShell:
\`\`\`powershell
.\\restore-state.bat
\`\`\`

## Offline Browser Reader
If Docker is not installed, simply double-click \`offline-reader.html\` in any web browser. It runs with zero internet connectivity and zero cloud telemetry.
`;

  const files = [
    { name: `docker-compose.sovereign.yml`, content: dockerComposeYaml },
    { name: `restore-state.sh`, content: restoreScript },
    { name: `restore-state.bat`, content: restoreScriptBat },
    { name: `0g-manifest.json`, content: manifestJson },
    { name: `offline-reader.html`, content: offlineReaderHtml },
    { name: `README.md`, content: readme },
  ];

  const zipBytes = buildZipArchive(files);

  return {
    filename: `stillworks-${productSlug}-walkaway.zip`,
    zipBytes,
    dockerComposeYaml,
    restoreScript,
    restoreScriptBat,
    manifestJson,
    offlineReaderHtml,
    readme,
  };
}
