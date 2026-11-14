import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { PANDEM_ESCROW_ID, PANDEM_AGENT_ID } from "@pandem/shared";

const execAsync = promisify(exec);
const TESTNET_RPC = "https://rpc.testnet.near.org";
const KILLSWITCH_FILE = path.resolve(__dirname, "../../.killswitch");
const LOCAL_KILLSWITCH_FILE = path.resolve(__dirname, "../.killswitch");

export interface RunnerState {
  lastRunTimestamp: string;
  heartbeatsSent: number;
  releasesTriggered: number;
  refundsTriggered: number;
  isKillswitchActive: boolean;
  recentLogs: string[];
}

export class AgentRunner {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private logs: string[] = [];
  private heartbeatsSent: number = 0;
  private releasesTriggered: number = 0;
  private refundsTriggered: number = 0;

  private log(msg: string) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [Runner] ${msg}`;
    console.log(formatted);
    this.logs.unshift(formatted);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  public getState(): RunnerState {
    const isKillswitchActive =
      fs.existsSync(KILLSWITCH_FILE) || fs.existsSync(LOCAL_KILLSWITCH_FILE);

    return {
      lastRunTimestamp: new Date().toISOString(),
      heartbeatsSent: this.heartbeatsSent,
      releasesTriggered: this.releasesTriggered,
      refundsTriggered: this.refundsTriggered,
      isKillswitchActive,
      recentLogs: [...this.logs],
    };
  }

  // View call via public RPC
  private async queryView(method: string, args: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(TESTNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `runner-${method}-${Date.now()}`,
          method: "query",
          params: {
            request_type: "call_function",
            finality: "optimistic",
            account_id: PANDEM_ESCROW_ID,
            method_name: method,
            args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
          },
        }),
      });
      const json = await res.json();
      if (json?.result?.result) {
        return JSON.parse(Buffer.from(json.result.result).toString("utf8"));
      }
    } catch (err: any) {
      this.log(`queryView(${method}) error: ${err.message}`);
    }
    return null;
  }

  // Call on-chain function using near-cli-rs and agent function-call key
  private async callContract(method: string, args: Record<string, any>, gas: string = "50.0 Tgas"): Promise<string | null> {
    const tmpFile = path.resolve(__dirname, `../data/temp_${method}_${Date.now()}.json`);
    const dataDir = path.dirname(tmpFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      fs.writeFileSync(tmpFile, JSON.stringify(args), "utf8");
      const cmd = `near contract call-function as-transaction ${PANDEM_ESCROW_ID} ${method} file-args "${tmpFile}" prepaid-gas "${gas}" attached-deposit "0 NEAR" sign-as ${PANDEM_AGENT_ID} network-config testnet sign-with-keychain send`;
      
      const { stdout } = await execAsync(cmd);
      
      const txMatch =
        stdout.match(/https:\/\/explorer\.testnet\.near\.org\/transactions\/([A-Za-z0-9]+)/) ||
        stdout.match(/Transaction ID:\s*([A-Za-z0-9]+)/i);
      const txId = txMatch ? txMatch[1] : "confirmed";
      return txId;
    } catch (err: any) {
      this.log(`Error calling ${method}: ${err.message || String(err)}`);
      return null;
    } finally {
      if (fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile); } catch {}
      }
    }
  }

  public async runCycle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const isKillswitchActive =
        fs.existsSync(KILLSWITCH_FILE) || fs.existsSync(LOCAL_KILLSWITCH_FILE);

      if (isKillswitchActive) {
        this.log("Killswitch file detected (.killswitch). Heartbeats suspended.");
      } else {
        // Query all products from contract
        const productList: Array<[number, any]> = await this.queryView("list_products", {}) || [];

        for (const [prodId, product] of productList) {
          if (product && product.status === "Active") {
            const lastPeriod = Number(product.last_heartbeat_period || 0);
            const nextPeriod = lastPeriod + 1;

            this.log(`Product #${prodId} active. Sending heartbeat for period #${nextPeriod}...`);
            const txId = await this.callContract("heartbeat", {
              product_id: Number(prodId),
              period: nextPeriod,
            });

            if (txId) {
              this.heartbeatsSent++;
              this.log(`✓ Heartbeat for product #${prodId} period #${nextPeriod} confirmed! Tx: ${txId}`);
            }
          }
        }
      }

      // Check known agreements 1 through 5
      for (let agrId = 1; agrId <= 5; agrId++) {
        const agreement = await this.queryView("get_agreement", { id: agrId });
        const escrow = await this.queryView("get_escrow", { id: agrId });

        if (agreement && escrow && !escrow.refunded) {
          const released = Number(escrow.released_periods || 0);
          const funded = Number(escrow.funded_periods || 0);

          if (released < funded) {
            const product = await this.queryView("get_product", { id: Number(agreement.product_id) });
            const lastHb = Number(product?.last_heartbeat_period || 0);
            const startPeriod = Number(agreement.start_product_period || 1);
            const requiredHb = startPeriod + released; // D-06 check

            if (lastHb >= requiredHb) {
              this.log(`Agreement #${agrId} period ${released + 1} ready. Triggering release...`);
              const txId = await this.callContract("release_period", { agreement_id: agrId }, "100.0 Tgas");
              if (txId) {
                this.releasesTriggered++;
                this.log(`✓ Release for agreement #${agrId} period ${released + 1} confirmed! Tx: ${txId}`);
              }
            }
          }

          // Check if refund is claimable
          const isClaimable = await this.queryView("is_refund_claimable", { agreement_id: agrId });
          if (isClaimable) {
            this.log(`Agreement #${agrId} refund claimable! Triggering claim_refund...`);
            const txId = await this.callContract("claim_refund", { agreement_id: agrId }, "100.0 Tgas");
            if (txId) {
              this.refundsTriggered++;
              this.log(`✓ Refund for agreement #${agrId} confirmed! Tx: ${txId}`);
            }
          }
        }
      }
    } catch (err: any) {
      this.log(`Cycle error: ${err.message || String(err)}`);
    } finally {
      this.isRunning = false;
    }
  }

  public start(intervalMs: number = 20000): void {
    if (this.timer) return;
    this.log(`Starting autonomous agent runner (interval: ${intervalMs / 1000}s)...`);
    this.timer = setInterval(() => this.runCycle(), intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.log("Agent runner stopped.");
    }
  }
}
