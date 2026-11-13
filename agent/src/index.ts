import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 8787;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (process.env["NODE_ENV"] !== "test") {
  app.listen(port, () => {
    console.log(`Pandem agent listening on http://localhost:${port}`);
  });
}

export default app;
