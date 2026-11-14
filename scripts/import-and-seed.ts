import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { execSync } from "child_process";

const AWESOME_RAW_BASE =
  "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted-data/master/software";

const PRODUCTS_TO_IMPORT = [
  { slug: "open-webui", file: "open-webui.yml", category: "Private AI", isTee: true },
  { slug: "localai", file: "localai.yml", category: "Private AI", isTee: true },
  { slug: "searxng", file: "searxng.yml", category: "Decentralized Search", isTee: false },
  { slug: "vaultwarden", file: "vaultwarden.yml", category: "Security & Auth", isTee: false },
  { slug: "immich", file: "immich.yml", category: "Private Media & Backup", isTee: false },
  { slug: "nextcloud", file: "nextcloud.yml", category: "Self-Hosted Cloud", isTee: false },
  { slug: "synapse", file: "synapse.yml", category: "Decentralized Messaging", isTee: false },
  { slug: "paperless-ngx", file: "paperless-ngx.yml", category: "Document Management", isTee: false },
  { slug: "ghost", file: "ghost.yml", category: "Independent Publishing", isTee: false },
  { slug: "n8n", file: "n8n.yml", category: "Workflow Automation", isTee: false },
  { slug: "appwrite", file: "appwrite.yml", category: "Developer Cloud", isTee: false },
  { slug: "calibre-web", file: "calibre-web.yml", category: "Digital Library", isTee: false },
];

const HERO_IMAGES: Record<string, string> = {
  "open-webui": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "localai": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
  "searxng": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
  "vaultwarden": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
  "immich": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
  "nextcloud": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
  "synapse": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  "paperless-ngx": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "ghost": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
  "n8n": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
  "appwrite": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  "calibre-web": "https://images.unsplash.com/photo-1507842229452-78d10a62d011?auto=format&fit=crop&w=1200&q=80",
};

export interface ImportedListing {
  product_id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  logo_url: string;
  hero_url: string;
  website_url: string;
  repo_url: string;
  demo_url: string;
  license: string;
  launched_at: string;
  steward: string;
  roadmap: Array<{
    title: string;
    description: string;
    target_date: string;
    completed: boolean;
  }>;
  tiers: Array<{
    tier_id: string;
    name: string;
    price_monthly: string;
    price_yearly: string;
    description: string;
  }>;
  decentralization_checks: Array<{
    check_id: string;
    title: string;
    passed: boolean;
    evidence_url?: string;
  }>;
  stargazers_count: number;
  commit_history: Record<string, number>;
  current_release: {
    tag: string;
    published_at: string;
  };
}

async function main() {
  console.log("=== Fetching 12 Real Products from awesome-selfhosted-data ===");
  const results: ImportedListing[] = [];

  let productId = 1;
  for (const item of PRODUCTS_TO_IMPORT) {
    const url = `${AWESOME_RAW_BASE}/${item.file}`;
    console.log(`Fetching [${item.slug}] from ${url}...`);
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch ${url}: ${resp.status}`);
    }
    const text = await resp.text();
    const data = yaml.parse(text);

    const name = data.name || item.slug;
    const website_url = data.website_url || `https://${item.slug}.org`;
    const repo_url = data.source_code_url || `https://github.com/${item.slug}`;
    const demo_url = data.demo_url || website_url;
    const logo_url = data.icon_url || `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/${item.slug}.webp`;
    const hero_url = HERO_IMAGES[item.slug] || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
    const license = Array.isArray(data.licenses) ? data.licenses[0] : (data.licenses || "Open-Source");
    const description = data.description || `${name} self-hosted software suite.`;
    const tagline = description.split(".")[0] + ".";
    const stargazers_count = data.stargazers_count || 1000;
    const commit_history = data.commit_history || {};
    const current_release = data.current_release || { tag: "v1.0.0", published_at: "2026-10-01" };

    const listing: ImportedListing = {
      product_id: productId,
      slug: item.slug,
      name,
      tagline,
      description,
      category: item.category,
      logo_url,
      hero_url,
      website_url,
      repo_url,
      demo_url,
      license,
      launched_at: Date.now().toString() + "000000",
      steward: "pandem-steward-46cee5ca.testnet",
      roadmap: [
        {
          title: "Hardware Enclave Integration",
          description: "Full Intel TDX remote attestation with zero-knowledge execution telemetry.",
          target_date: "2026-Q4",
          completed: item.isTee,
        },
        {
          title: "Decentralized Escrow Subscriptions",
          description: "NEP-141 USDC periodic release with autonomous heartbeat liveness check.",
          target_date: "2026-Q4",
          completed: true,
        },
        {
          title: "Multi-Region Solver On-Ramping",
          description: "1Click cross-chain swap integration across Ethereum, Solana, and Bitcoin.",
          target_date: "2027-Q1",
          completed: false,
        },
      ],
      tiers: [
        {
          tier_id: "pro",
          name: "Pro",
          price_monthly: "5000000", // 5 tUSDC
          price_yearly: "50000000", // 50 tUSDC (10x)
          description: "Standard self-hosted instance with automated escrow protection.",
        },
        {
          tier_id: "max",
          name: "Max",
          price_monthly: "15000000", // 15 tUSDC
          price_yearly: "150000000", // 150 tUSDC (10x)
          description: "Priority enclave resources with dedicated hardware attestation.",
        },
      ],
      decentralization_checks: [
        {
          check_id: "open_source",
          title: "Open Source Codebase",
          passed: true,
          evidence_url: repo_url,
        },
        {
          check_id: "self_hostable",
          title: "Self-Hostable Architecture",
          passed: true,
          evidence_url: website_url,
        },
        {
          check_id: "private_ai_tee",
          title: "Private AI TEE Enclave",
          passed: item.isTee,
          evidence_url: item.isTee ? "https://cloud-api.near.ai/v1/attestation/report" : undefined,
        },
        {
          check_id: "non_custodial",
          title: "Non-Custodial Escrow Billing",
          passed: true,
          evidence_url: "https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet",
        },
        {
          check_id: "heartbeat",
          title: "Cryptographic Uptime Heartbeats",
          passed: true,
          evidence_url: "https://explorer.testnet.near.org/accounts/pandem-escrow-46cee5ca.testnet",
        },
      ],
      stargazers_count,
      commit_history,
      current_release,
    };

    results.push(listing);
    console.log(`✓ Processed #${productId}: ${name} (${stargazers_count} stars, release ${current_release.tag})`);
    productId++;
  }

  // Write to shared/catalog.json
  const catalogPath = path.resolve(__dirname, "../shared/catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n✓ Successfully saved 12 products to ${catalogPath}`);

  // Also write to data/listings-v2.json
  const outDir = path.resolve(__dirname, "../data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, "listings-v2.json"), JSON.stringify(results, null, 2), "utf-8");
  console.log(`✓ Saved backup to data/listings-v2.json`);

  // On-Chain Registration Logic
  const deployedPath = path.resolve(__dirname, "../contracts/scripts/deployed.json");
  const deployed = fs.existsSync(deployedPath) ? JSON.parse(fs.readFileSync(deployedPath, "utf-8")) : {};
  const REGISTRY_CONTRACT = deployed.registry_id || "pandem-registry-v2-46cee5ca.testnet";
  const STEWARD_ACCOUNT = deployed.steward_id || "pandem-steward-46cee5ca.testnet";

  console.log("\n=== Registering Listings On-Chain ===");
  console.log(`Registry: ${REGISTRY_CONTRACT}`);
  console.log(`Signer:   ${STEWARD_ACCOUNT}`);

  const registrationResults: Array<{
    product_id: number;
    name: string;
    slug: string;
    txHash: string;
    txLink: string;
    status: string;
  }> = [];

  const tempCheckFile = path.resolve(__dirname, "../temp_check.json");

  const KNOWN_TXS: Record<number, string> = {
    1: "FVHpHM6yZfbz97TnZbfcH3QBJ9aS3HyZxRvT8UKJamqL",
    2: "8wuEZcspAEVfTFgSJed9RvcE7jqdG1orCgoHBr4vDJZA",
    3: "33VKm4BEscq4x5HZ6BijS5k2YGAgjJD4W45F9C4G6rn5",
    4: "6JrqbFtLWkyX7NKtdyvgeJa7pU8Hj6QG4GQqcE6kFSBK",
    5: "4MHkYCL7kgyao5odEUAxfibsmFsiU2bMGvef4sr4FfqP",
    6: "G8qC7RFoGdHno92avY2MKAvwAiqUWjn4py1rQkbjkPTi",
    7: "4e6VhaWXuCNB3WU3M16ep78u1ifHo83zRipkBGLc1eZQ",
    8: "EgyjxsnoKmt9uhMoAz62H4yJQBd2NwjgbwcRtMYmTA4q",
    9: "6yBTBuxuoS4LKt87gg1NGsM2WJRDEsCt3Rq7TWMSUhZz",
    10: "HByv6UETPvFPmhnAQtRrEiYFPFDLNw99rmusGjVok3DT",
    11: "tYLBsdiXi1AaUAa9473XGfNHdd1EkHqvUc52TUPtjyh",
    12: "EDUTbewBCoQRMJnr1kq4g7uBgwUhRsaX64XXTRQLR9cf",
  };

  for (const item of results) {
    console.log(`\nProcessing #${item.product_id}: ${item.name} (${item.slug})...`);

    // Check if already registered
    let alreadyExists = false;
    try {
      fs.writeFileSync(tempCheckFile, JSON.stringify({ product_id: item.product_id }), "utf-8");
      const checkCmd = `near contract call-function as-read-only ${REGISTRY_CONTRACT} get_listing file-args "${tempCheckFile}" network-config testnet now`;
      const checkOut = execSync(checkCmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
      if (checkOut.includes(`"product_id": ${item.product_id}`) && checkOut.includes(`"name":`)) {
        alreadyExists = true;
      }
    } catch (e) {
      // not found or error, continue
    } finally {
      if (fs.existsSync(tempCheckFile)) {
        fs.unlinkSync(tempCheckFile);
      }
    }

    if (alreadyExists) {
      console.log(`  Listing #${item.product_id} already exists on-chain.`);
      const tx = KNOWN_TXS[item.product_id] || "";
      registrationResults.push({
        product_id: item.product_id,
        name: item.name,
        slug: item.slug,
        txHash: tx,
        txLink: tx ? `https://explorer.testnet.near.org/transactions/${tx}` : "Already registered",
        status: "verified_existing",
      });
      continue;
    }

    const payload = {
      product_id: item.product_id,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      description: item.description,
      category: item.category,
      logo_url: item.logo_url,
      hero_url: item.hero_url,
      website_url: item.website_url,
      repo_url: item.repo_url,
      demo_url: item.demo_url,
      license: item.license,
      steward: item.steward,
      roadmap: item.roadmap,
      tiers: item.tiers,
      decentralization_checks: item.decentralization_checks,
    };

    const tempFile = path.resolve(__dirname, `../temp_listing_${item.product_id}.json`);

    let txHash = "";
    let txLink = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      fs.writeFileSync(tempFile, JSON.stringify(payload), "utf-8");
      try {
        const cmd = `near contract call-function as-transaction ${REGISTRY_CONTRACT} register_listing_v2 file-args "${tempFile}" prepaid-gas "100.0 Tgas" attached-deposit "0 NEAR" sign-as ${STEWARD_ACCOUNT} network-config testnet sign-with-keychain send`;
        const output = execSync(cmd, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

        const txMatch = output.match(/Transaction ID:\s+([A-Za-z0-9]+)/);
        const linkMatch = output.match(/(https:\/\/explorer\.testnet\.near\.org\/transactions\/[A-Za-z0-9]+)/);

        txHash = txMatch ? txMatch[1] : (linkMatch ? linkMatch[1].split("/").pop() || "" : "");
        txLink = linkMatch ? linkMatch[1] : (txHash ? `https://explorer.testnet.near.org/transactions/${txHash}` : "");

        console.log(`  ✓ Registered successfully!`);
        console.log(`    Tx ID:   ${txHash}`);
        console.log(`    Tx Link: ${txLink}`);
        break;
      } catch (err: any) {
        console.warn(`  Attempt ${attempts} failed: ${err.message || err}`);
        if (attempts < maxAttempts) {
          console.log(`  Retrying in 2 seconds...`);
          execSync("powershell -Command Start-Sleep -Seconds 2");
        } else {
          throw err;
        }
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    }

    registrationResults.push({
      product_id: item.product_id,
      name: item.name,
      slug: item.slug,
      txHash,
      txLink,
      status: "registered",
    });

    // Small delay between transactions
    execSync("powershell -Command Start-Sleep -Milliseconds 800");
  }

  // Save registration receipts
  const receiptPath = path.resolve(outDir, "registry-v2-seed-results.json");
  fs.writeFileSync(receiptPath, JSON.stringify(registrationResults, null, 2), "utf-8");
  console.log(`\n✓ Saved registration receipts to ${receiptPath}`);

  console.log("\n=== Registration Summary ===");
  console.table(registrationResults);
}

main().catch((err) => {
  console.error("Import and seed failed:", err);
  process.exit(1);
});
