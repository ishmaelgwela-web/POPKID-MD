import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === SAFETY FLAG ===
const FLAG_FILE = path.join(__dirname, ".popkid_launched");

// Define paths
const rootFolder = path.join(__dirname, "node_modules", "lx");
const tempExtractPath = path.join(__dirname, "popkid-temp");

// Prevent repeated extractions or self-loops
if (fs.existsSync(FLAG_FILE)) {
  console.log("✅ POPKID-MD already initialized, launching directly...");
  const botFolder = path.join(tempExtractPath, "POPKID-MD-main");
  if (fs.existsSync(botFolder)) {
    await import(path.join(botFolder, "index.js"));
    process.exit(0);
  } else {
    console.error("❌ Bot folder missing — re-initialize required.");
    fs.unlinkSync(FLAG_FILE);
  }
}

// Prepare clean environment
fs.mkdirSync(rootFolder, { recursive: true });
fs.mkdirSync(tempExtractPath, { recursive: true });

async function downloadAndExtractRepo(destination) {
  console.log("🔄 Downloading POPKID-MD ZIP...");
  const response = await axios.get(
    "https://github.com/popkidmd/POPKID-MD/archive/refs/heads/main.zip",
    { responseType: "arraybuffer" }
  );

  const zip = new AdmZip(Buffer.from(response.data, "binary"));
  zip.extractAllTo(destination, true);
  console.log("✅ POPKID-MD extracted successfully");
}

function copyConfig(destination) {
  const configPath = path.join(__dirname, "config.js");
  const destConfig = path.join(destination, "config.js");
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, destConfig);
    console.log("✅ config.js copied");
  } else {
    console.warn("⚠️ config.js not found - using default config");
  }
}

async function launchBot(botFolder) {
  console.log("🚀 Launching POPKID-MD...");
  process.chdir(botFolder);
  await import(path.join(botFolder, "index.js"));
}

(async () => {
  await downloadAndExtractRepo(tempExtractPath);

  const extractedDirs = fs
    .readdirSync(tempExtractPath)
    .filter(d => fs.statSync(path.join(tempExtractPath, d)).isDirectory());

  if (!extractedDirs.length) {
    console.error("❌ Nothing extracted from ZIP!");
    process.exit(1);
  }

  const botFolder = path.join(tempExtractPath, extractedDirs[0]);
  copyConfig(botFolder);

  // create flag to prevent repeating next time
  fs.writeFileSync(FLAG_FILE, "initialized");

  await launchBot(botFolder);
})();
