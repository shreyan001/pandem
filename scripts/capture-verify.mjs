import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screensDir = path.resolve("reports/screens");

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

const targetUrl = "http://localhost:3000/verify?agreement_id=3";
const outPath = path.join(screensDir, "verify-1280.png");

console.log(`Capturing verify-1280.png from ${targetUrl}...`);
// virtual-time-budget allows async RPC calls to fastnear to resolve and render verified badges
const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=7000 --window-size=1280,1800 --screenshot="${outPath}" "${targetUrl}"`;

try {
  execSync(cmd, { stdio: "inherit", timeout: 25000 });
  console.log(`✓ Saved ${outPath}`);
  const stat = fs.statSync(outPath);
  console.log(`File size: ${(stat.size / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error("Screenshot capture failed:", err.message);
  process.exit(1);
}
