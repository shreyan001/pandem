import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const catalog = JSON.parse(fs.readFileSync("shared/catalog.json", "utf8")).slice(0, 12);
const tmpFile = path.join(os.tmpdir(), "temp_budget_reg.json");

for (const item of catalog) {
  if (item.product_id === 1) continue;
  const pid = item.product_id;
  const args = {
    product_id: pid,
    steward: "pandem-steward-46cee5ca.testnet",
    agent_address: "pandem-agent-46cee5ca.testnet",
    period_draw_cap: "1500000",
    initial_unit_cost: "1000",
    total_periods: 12,
    projected_remaining_cost: "18000000",
  };
  fs.writeFileSync(tmpFile, JSON.stringify(args));
  console.log(`Registering budget for product #${pid}...`);
  execSync(
    `near contract call-function as-transaction pandem-budget-d1-8f199e48.testnet register_budget file-args "${tmpFile}" prepaid-gas "30.0 Tgas" attached-deposit "0 NEAR" sign-as pandem-budget-d1-8f199e48.testnet network-config testnet sign-with-keychain send`,
    { stdio: "inherit" }
  );
}

try { fs.unlinkSync(tmpFile); } catch {}
console.log("All budgets registered successfully!");
