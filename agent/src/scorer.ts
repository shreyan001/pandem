import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface DecentralizationCheckInput {
  check_id: string;
  title: string;
  passed: boolean;
  evidence_url?: string;
}

export interface ScoreInputBreakdown {
  product_id: number;
  slug: string;
  name: string;
  billing_attached: {
    escrow_service: boolean;
    budget_service: boolean;
    points: number; // 0 - 20
  };
  developer_activity: {
    commits_last_3_months: number;
    days_since_last_release: number;
    last_release_tag: string;
    commits_points: number; // 0 - 15
    release_recency_points: number; // 0 - 10
    points: number; // 0 - 25
  };
  growth: {
    stargazers_count: number;
    subscribers_count: number;
    stars_points: number; // 0 - 10
    subscribers_points: number; // 0 - 5
    points: number; // 0 - 15
  };
  decentralization_checks: {
    open_source: boolean; // 10 pts
    self_hostable: boolean; // 10 pts
    private_ai_tee: boolean; // 10 pts
    non_custodial: boolean; // 5 pts
    heartbeat: boolean; // 5 pts
    points: number; // 0 - 40
  };
  total_score: number; // 0 - 100
}

export interface ScoreCalculationResult {
  score: number;
  inputsHash: string;
  canonicalInputs: ScoreInputBreakdown;
}

export interface ScoreTransactionResult {
  productId: number;
  name: string;
  slug: string;
  score: number;
  inputsHash: string;
  txHash: string;
  txLink: string;
}

/**
 * Deterministically sorts all object keys recursively to produce canonical JSON.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalizeJson).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`
  );
  return "{" + parts.join(",") + "}";
}

/**
 * Compute SHA-256 hash of canonical JSON string.
 */
export function computeInputsHash(canonicalJson: string): string {
  return crypto.createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Calculates the decentralization score (0-100) per UPGRADE-V2.md §3:
 * - Billing-attached services (0-20 pts)
 * - Developer activity (0-25 pts: commits up to 15, recency up to 10)
 * - Growth (0-15 pts: stars up to 10, subscribers up to 5)
 * - Decentralization checks (0-40 pts: open_source 10, self_hostable 10, private_ai_tee 10, non_custodial 5, heartbeat 5)
 */
export function calculateProductScore(
  item: any,
  referenceDate: Date = new Date("2026-11-14T05:00:00Z")
): ScoreCalculationResult {
  const productId = Number(item.product_id);
  const slug = item.slug || `product-${productId}`;
  const name = item.name || slug;

  // 1. Billing-attached services (0 - 20 pts)
  // Escrow subscription tiers attached: 10 pts
  // Budget / private AI compute / ops draw attached: 10 pts
  const hasEscrow = Array.isArray(item.tiers) && item.tiers.length > 0;
  const isTeeOrBudget =
    item.isTee === true ||
    (Array.isArray(item.decentralization_checks) &&
      item.decentralization_checks.some(
        (c: any) => c.check_id === "private_ai_tee" && c.passed
      ));
  const escrowPoints = hasEscrow ? 10 : 0;
  const budgetPoints = isTeeOrBudget ? 10 : 0;
  const billingPoints = Math.min(20, escrowPoints + budgetPoints);

  // 2. Developer activity (0 - 25 pts)
  // Commits in last 3 months (up to 15 pts)
  const commitHistory: Record<string, number> = item.commit_history || {};
  const sortedMonths = Object.keys(commitHistory).sort().reverse();
  const recent3Months = sortedMonths.slice(0, 3);
  const commitsLast3M = recent3Months.reduce(
    (acc, m) => acc + (commitHistory[m] || 0),
    0
  );

  let commitsPoints = 0;
  if (commitsLast3M >= 100) {
    commitsPoints = 15;
  } else if (commitsLast3M >= 50) {
    commitsPoints = 12;
  } else if (commitsLast3M >= 20) {
    commitsPoints = 8;
  } else if (commitsLast3M >= 5) {
    commitsPoints = 5;
  } else if (commitsLast3M > 0) {
    commitsPoints = 2;
  }

  // Days since last release (up to 10 pts)
  const publishedAtStr =
    item.current_release?.published_at ||
    (item.current_release?.published_at_ns
      ? new Date(Number(item.current_release.published_at_ns) / 1e6).toISOString()
      : "2026-11-01");
  const publishedDate = new Date(publishedAtStr);
  const daysSinceRelease = Math.max(
    0,
    Math.floor(
      (referenceDate.getTime() - publishedDate.getTime()) / (1000 * 3600 * 24)
    )
  );

  let releaseRecencyPoints = 0;
  if (daysSinceRelease <= 14) {
    releaseRecencyPoints = 10;
  } else if (daysSinceRelease <= 30) {
    releaseRecencyPoints = 8;
  } else if (daysSinceRelease <= 60) {
    releaseRecencyPoints = 6;
  } else if (daysSinceRelease <= 90) {
    releaseRecencyPoints = 4;
  } else if (daysSinceRelease <= 180) {
    releaseRecencyPoints = 2;
  }

  const devActivityPoints = Math.min(25, commitsPoints + releaseRecencyPoints);

  // 3. Growth (0 - 15 pts)
  // Stargazers count (up to 10 pts)
  const stars = Number(item.stargazers_count || 0);
  let starsPoints = 0;
  if (stars >= 50000) {
    starsPoints = 10;
  } else if (stars >= 20000) {
    starsPoints = 8;
  } else if (stars >= 5000) {
    starsPoints = 6;
  } else if (stars >= 1000) {
    starsPoints = 4;
  } else if (stars >= 100) {
    starsPoints = 2;
  }

  // Subscribers count (up to 5 pts)
  const subscribers = Number(item.subscribers_count || item.subscribers || 1);
  let subscribersPoints = 0;
  if (subscribers >= 5) {
    subscribersPoints = 5;
  } else if (subscribers >= 3) {
    subscribersPoints = 4;
  } else if (subscribers >= 1) {
    subscribersPoints = 3;
  } else {
    subscribersPoints = 1;
  }

  const growthPoints = Math.min(15, starsPoints + subscribersPoints);

  // 4. Decentralization checks (0 - 40 pts)
  const checks: DecentralizationCheckInput[] =
    item.decentralization_checks || [];
  const checkMap: Record<string, boolean> = {};
  for (const c of checks) {
    checkMap[c.check_id] = Boolean(c.passed);
  }

  const openSource = Boolean(checkMap["open_source"]);
  const selfHostable = Boolean(checkMap["self_hostable"]);
  const privateAiTee = Boolean(checkMap["private_ai_tee"]);
  const nonCustodial = Boolean(checkMap["non_custodial"]);
  const heartbeat = Boolean(checkMap["heartbeat"]);

  const checksPoints =
    (openSource ? 10 : 0) +
    (selfHostable ? 10 : 0) +
    (privateAiTee ? 10 : 0) +
    (nonCustodial ? 5 : 0) +
    (heartbeat ? 5 : 0);

  // Total Score (0 - 100)
  const totalScore = Math.min(
    100,
    Math.max(0, billingPoints + devActivityPoints + growthPoints + checksPoints)
  );

  const canonicalInputs: ScoreInputBreakdown = {
    product_id: productId,
    slug,
    name,
    billing_attached: {
      escrow_service: hasEscrow,
      budget_service: isTeeOrBudget,
      points: billingPoints,
    },
    developer_activity: {
      commits_last_3_months: commitsLast3M,
      days_since_last_release: daysSinceRelease,
      last_release_tag: item.current_release?.tag || "v1.0.0",
      commits_points: commitsPoints,
      release_recency_points: releaseRecencyPoints,
      points: devActivityPoints,
    },
    growth: {
      stargazers_count: stars,
      subscribers_count: subscribers,
      stars_points: starsPoints,
      subscribers_points: subscribersPoints,
      points: growthPoints,
    },
    decentralization_checks: {
      open_source: openSource,
      self_hostable: selfHostable,
      private_ai_tee: privateAiTee,
      non_custodial: nonCustodial,
      heartbeat: heartbeat,
      points: checksPoints,
    },
    total_score: totalScore,
  };

  const canonicalJson = canonicalizeJson(canonicalInputs);
  const inputsHash = computeInputsHash(canonicalJson);

  return {
    score: totalScore,
    inputsHash,
    canonicalInputs,
  };
}

/**
 * Executes on-chain update_score call on NEAR testnet via near-cli-rs.
 */
export async function submitScoreToRegistry(
  registryContract: string,
  agentAccount: string,
  productId: number,
  score: number,
  inputsHash: string
): Promise<{ txHash: string; txLink: string }> {
  const tmpFile = path.resolve(
    __dirname,
    `../data/score_call_${productId}_${Date.now()}.json`
  );
  const dataDir = path.dirname(tmpFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const payload = {
    product_id: productId,
    score: score,
    inputs_hash: inputsHash,
  };

  let txHash = "";
  let txLink = "";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    fs.writeFileSync(tmpFile, JSON.stringify(payload), "utf-8");

    try {
      const cmd = `near contract call-function as-transaction ${registryContract} update_score file-args "${tmpFile}" prepaid-gas "50.0 Tgas" attached-deposit "0 NEAR" sign-as ${agentAccount} network-config testnet sign-with-keychain send`;
      console.log(`[Score TX #${productId}] Attempt ${attempts}: Sending on-chain...`);
      const { stdout, stderr } = await execAsync(cmd, { encoding: "utf-8" });

      const combined = (stdout || "") + "\n" + (stderr || "");

      const urlMatch = combined.match(
        /https:\/\/explorer\.testnet\.near\.org\/transactions\/([A-Za-z0-9]+)/
      );
      const idMatch = combined.match(/Transaction ID:\s*([A-Za-z0-9]+)/i);

      if (urlMatch) {
        txHash = urlMatch[1];
        txLink = urlMatch[0];
        break;
      } else if (idMatch) {
        txHash = idMatch[1];
        txLink = `https://explorer.testnet.near.org/transactions/${txHash}`;
        break;
      }

      if (combined.includes("succeeded") || combined.includes("EVENT_JSON")) {
        txHash = "confirmed_on_chain";
        txLink = `https://explorer.testnet.near.org/accounts/${registryContract}`;
        break;
      }

      console.warn(`[Score TX #${productId}] Could not parse hash, output:`, combined);
    } catch (err: any) {
      console.error(
        `[Score TX #${productId}] Attempt ${attempts} error:`,
        err.message || String(err)
      );
      if (attempts >= maxAttempts) {
        throw new Error(
          `Failed to update score for product #${productId} after ${maxAttempts} attempts: ${err.message}`
        );
      }
      // wait 2 seconds before retry
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      if (fs.existsSync(tmpFile)) {
        try {
          fs.unlinkSync(tmpFile);
        } catch {}
      }
    }
  }

  return { txHash, txLink };
}

/**
 * Main function: reads catalog.json, calculates scores and inputs hashes,
 * and submits each score to pandem-registry-v2 on testnet.
 */
export async function runScorer(): Promise<ScoreTransactionResult[]> {
  console.log("=================================================");
  console.log("   PANDEM AGENT: DECENTRALIZATION SCORER V2     ");
  console.log("=================================================\n");

  const deployedPath = path.resolve(
    __dirname,
    "../../contracts/scripts/deployed.json"
  );
  if (!fs.existsSync(deployedPath)) {
    throw new Error(`deployed.json not found at ${deployedPath}`);
  }
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
  const registryContract =
    deployed.registry_id || "pandem-registry-v2-46cee5ca.testnet";
  const agentAccount = deployed.agent_id || "pandem-agent-46cee5ca.testnet";

  console.log(`Registry: ${registryContract}`);
  console.log(`Agent:    ${agentAccount}\n`);

  // Load products from shared/catalog.json
  const catalogPath = path.resolve(__dirname, "../../shared/catalog.json");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog not found at ${catalogPath}`);
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  console.log(`Loaded ${catalog.length} products from catalog.\n`);

  const results: ScoreTransactionResult[] = [];
  const scoreBreakdowns: Record<number, ScoreInputBreakdown> = {};

  for (const item of catalog) {
    const calc = calculateProductScore(item);
    const productId = Number(item.product_id);
    const name = item.name;
    const slug = item.slug;

    console.log(
      `Scoring #${productId}: ${name} (${slug}) -> Score: ${calc.score}/100`
    );
    console.log(`  Inputs Hash: ${calc.inputsHash}`);
    console.log(
      `  Breakdown: Billing=${calc.canonicalInputs.billing_attached.points}/20, ` +
        `DevActivity=${calc.canonicalInputs.developer_activity.points}/25, ` +
        `Growth=${calc.canonicalInputs.growth.points}/15, ` +
        `Checks=${calc.canonicalInputs.decentralization_checks.points}/40`
    );

    scoreBreakdowns[productId] = calc.canonicalInputs;

    // Submit score on-chain
    console.log(`  Broadcasting update_score to testnet...`);
    const { txHash, txLink } = await submitScoreToRegistry(
      registryContract,
      agentAccount,
      productId,
      calc.score,
      calc.inputsHash
    );

    console.log(`  ✓ Confirmed on testnet! Tx: ${txHash}`);
    console.log(`    Link: ${txLink}\n`);

    results.push({
      productId,
      name,
      slug,
      score: calc.score,
      inputsHash: calc.inputsHash,
      txHash,
      txLink,
    });

    // Update item in catalog
    item.score = calc.score;
    item.score_inputs_hash = calc.inputsHash;
  }

  // Update shared/catalog.json with live scores and hashes
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf-8");
  console.log(`✓ Updated ${catalogPath} with on-chain scores and hashes.`);

  // Save audit log to agent/data/scores_audit.json
  const auditPath = path.resolve(__dirname, "../data/scores_audit.json");
  const dataDir = path.dirname(auditPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(
    auditPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        registry: registryContract,
        agent: agentAccount,
        results,
        breakdowns: scoreBreakdowns,
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`✓ Saved score audit records to ${auditPath}\n`);

  return results;
}

// Run CLI if invoked directly
if (require.main === module) {
  runScorer()
    .then((results) => {
      console.log("=== SCORER RUN COMPLETED SUCCESSFULLY ===");
      console.log(`Total Products Scored: ${results.length}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Scorer failed:", err);
      process.exit(1);
    });
}
