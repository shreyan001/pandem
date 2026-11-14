import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screensDir = path.resolve("reports/screens");

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

const targets = [
  { name: "feed-1280.png", url: "http://localhost:3000", width: 1280, height: 1000 },
  { name: "feed-390.png", url: "http://localhost:3000", width: 390, height: 844 },
  { name: "product-1280.png", url: "http://localhost:3000/products/aegis-legal", width: 1280, height: 1000 },
  { name: "product-390.png", url: "http://localhost:3000/products/aegis-legal", width: 390, height: 844 },
  { name: "dashboard-1280.png", url: "http://localhost:3000/dashboard", width: 1280, height: 1000 },
  { name: "dashboard-390.png", url: "http://localhost:3000/dashboard", width: 390, height: 844 },
  { name: "dev-dashboard-1280.png", url: "http://localhost:3000/dev/dashboard", width: 1280, height: 1000 },
  { name: "dev-dashboard-390.png", url: "http://localhost:3000/dev/dashboard", width: 390, height: 844 },
];

for (const target of targets) {
  const outPath = path.join(screensDir, target.name);
  console.log(`Capturing ${target.name} from ${target.url}...`);
  const cmd = `"${edgePath}" --headless --disable-gpu --window-size=${target.width},${target.height} --screenshot="${outPath}" "${target.url}"`;
  try {
    execSync(cmd, { stdio: "inherit", timeout: 15000 });
    console.log(`✓ Saved ${outPath}`);
  } catch (err) {
    console.error(`Failed ${target.name}:`, err.message);
  }
}

console.log("\n=== Captured Screenshots in reports/screens/ ===");
fs.readdirSync(screensDir).forEach(f => {
  const stat = fs.statSync(path.join(screensDir, f));
  console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});
