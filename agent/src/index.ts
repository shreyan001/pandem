import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { verifyModelAttestation } from "./attestation";
import { executeChat } from "./chat";
import { AgentRunner } from "./runner";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const port = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 8787;

app.use(cors());
app.use(express.json());

const runner = new AgentRunner();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pandem-agent",
    network: "testnet",
    runner: runner.getState(),
  });
});

app.get("/attestation", async (req, res) => {
  try {
    const nonce = req.query["nonce"] ? String(req.query["nonce"]) : undefined;
    const result = await verifyModelAttestation(nonce);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }
    const result = await executeChat(messages);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.get("/runner/state", (_req, res) => {
  res.json(runner.getState());
});

app.post("/runner/cycle", async (_req, res) => {
  try {
    await runner.runCycle();
    res.json({ status: "executed", state: runner.getState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

if (process.env["NODE_ENV"] !== "test") {
  app.listen(port, () => {
    console.log(`Pandem agent listening on http://localhost:${port}`);
    // Start background runner loop
    runner.start(20000);
  });
}

export default app;
