import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { verifyModelAttestation } from "./attestation";
import { executeChat } from "./chat";
import { AgentRunner } from "./runner";
import { cloudPaymentEngine } from "./cloudPayment";

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

app.get("/cloud-payments", async (req, res) => {
  try {
    const productId = req.query["product_id"] ? parseInt(String(req.query["product_id"]), 10) : 1;
    const telemetry = await cloudPaymentEngine.getTelemetry(productId);
    res.json(telemetry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.post("/cloud-payments/settle", async (req, res) => {
  try {
    const { product_id, force } = req.body || {};
    const receipt = await cloudPaymentEngine.settlePendingInference({
      productId: product_id ? Number(product_id) : 1,
      force: Boolean(force),
    });
    res.json({
      success: true,
      receipt,
      telemetry: await cloudPaymentEngine.getTelemetry(product_id ? Number(product_id) : 1),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.post("/cloud-payments/simulate", async (req, res) => {
  try {
    const { product_id, query_count, custom_unit_cost_yocto } = req.body || {};
    const receipt = await cloudPaymentEngine.simulatePaymentDraw({
      productId: product_id ? Number(product_id) : 1,
      queryCount: query_count ? Number(query_count) : 3,
      customUnitCostYocto: custom_unit_cost_yocto ? String(custom_unit_cost_yocto) : undefined,
    });
    res.json({
      success: true,
      receipt,
      telemetry: await cloudPaymentEngine.getTelemetry(product_id ? Number(product_id) : 1),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
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
