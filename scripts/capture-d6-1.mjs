import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screensDir = path.resolve("reports/screens");

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

const outPath = path.join(screensDir, "onboarding-drawer-390.png");
console.log(`Capturing onboarding-drawer-390.png to ${outPath}...`);
const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=3000 --window-size=390,844 --screenshot="${outPath}" "http://localhost:3000/?onboard=1"`;

try {
  execSync(cmd, { stdio: "inherit", timeout: 15000 });
  const stat = fs.statSync(outPath);
  console.log(`✓ Saved ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error("Failed capture:", err.message);
  process.exit(1);
}
