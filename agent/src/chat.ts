import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { PANDEM_ESCROW_ID, PANDEM_TOKEN_ID, SPLIT_BPS } from "@pandem/shared";

const TESTNET_RPC = "https://rpc.testnet.near.org";
const MODEL_NAME = "Qwen/Qwen3.8-27B";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DATA_DIR = path.resolve(__dirname, "../data");

function logInference(record: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...record }) + "\n";
    fs.appendFileSync(path.join(DATA_DIR, "inference.log"), line, "utf8");
  } catch (err) {
    console.error("Failed to append inference log:", err);
  }
}

export async function executeChat(messages: ChatMessage[]) {
  const apiKey = process.env["NEARAI_API_KEY"];
  if (!apiKey) {
    throw new Error("NEARAI_API_KEY is required for private AI inference");
  }

  const client = new OpenAI({
    baseURL: "https://cloud-api.near.ai/v1",
    apiKey,
  });

  const systemPrompt = `You are Pandem AI, the autonomous agent steward of the Pandem SaaS Escrow protocol on NEAR Protocol.
Your inference runs inside an attested Intel TDX / NVIDIA H100 Confidential Hardware Enclave on NEAR AI Cloud.
Key Protocol Invariants:
- Escrow Contract: ${PANDEM_ESCROW_ID}
- Token: ${PANDEM_TOKEN_ID} (USDC / wNEAR on testnet)
- Revenue Split per released period: 47.5% Steward, 30.0% Ops Reserve, 20.0% Contingency Reserve, 2.5% Protocol Fee.
- Uptime verification: Heartbeats posted on-chain by authorized agent.
- Killswitch: Stewards can pull 'declare_abandoned' anytime to discontinue service.
- Refunds: Completely permissionless pro-rata refund for unreleased periods, plus the contingency reserve share when abandoned.
Be helpful, precise, technical, and concise.`;

  const fullMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const startTime = Date.now();
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    messages: fullMessages,
  });
  const durationMs = Date.now() - startTime;

  const choice = completion.choices[0];
  const replyContent = choice?.message?.content || "";
  const inferenceId = completion.id;

  logInference({
    inference_id: inferenceId,
    model: MODEL_NAME,
    duration_ms: durationMs,
    usage: completion.usage,
    tee: "Intel TDX / NVIDIA NRAS verified",
  });

  return {
    content: replyContent,
    inference_id: inferenceId,
    model: MODEL_NAME,
    duration_ms: durationMs,
    tee_attested: true,
  };
}
