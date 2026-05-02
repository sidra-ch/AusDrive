import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const errors = [];
const warnings = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseNodeVersion(version) {
  const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersion(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function collectRemotePatternHosts(nextConfigText) {
  const hostRegex = /hostname:\s*["']([^"']+)["']/g;
  const hosts = new Set();
  let match;
  while ((match = hostRegex.exec(nextConfigText)) !== null) {
    hosts.add(match[1]);
  }
  return hosts;
}

function hasTrackedEnvFile() {
  const gitIndex = path.join(root, ".git", "index");
  if (!fs.existsSync(gitIndex)) {
    warnings.push("No .git/index found; skipping tracked env file checks.");
    return false;
  }

  const trackedCandidates = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".env.vercel.production",
  ];

  try {
    const indexBuffer = fs.readFileSync(gitIndex);
    const indexText = indexBuffer.toString("latin1");
    return trackedCandidates.some((candidate) => indexText.includes(candidate));
  } catch {
    warnings.push("Unable to parse .git/index; skipping tracked env file checks.");
    return false;
  }
}

function main() {
  const packagePath = path.join(root, "package.json");
  const packageJson = readJson(packagePath);
  const scripts = packageJson.scripts ?? {};

  if (!scripts.start) {
    errors.push("package.json is missing scripts.start.");
  } else if (/server\.ts/i.test(scripts.start)) {
    errors.push("scripts.start points to server.ts. Use next start for Vercel deployment.");
  } else if (!/next\s+start/i.test(scripts.start)) {
    warnings.push("scripts.start does not contain 'next start'. Ensure Vercel-compatible startup.");
  }

  if (!packageJson.engines?.node) {
    errors.push("package.json is missing engines.node (required for consistent Vercel Node runtime).");
  } else {
    const nodeVersion = parseNodeVersion(packageJson.engines.node);
    if (!nodeVersion) {
      warnings.push(`Unable to parse engines.node='${packageJson.engines.node}'.`);
    } else {
      const minRequired = { major: 20, minor: 19, patch: 0 };
      if (compareVersion(nodeVersion, minRequired) < 0) {
        errors.push("engines.node is below 20.19.0; Prisma/Next may fail on Vercel.");
      }
    }
  }

  const proxyPath = path.join(root, "proxy.ts");
  const middlewarePath = path.join(root, "middleware.ts");
  if (fs.existsSync(proxyPath) && fs.existsSync(middlewarePath)) {
    errors.push("Both proxy.ts and middleware.ts exist. Next 16 expects proxy.ts only.");
  }

  const nextConfigPath = path.join(root, "next.config.ts");
  if (!fs.existsSync(nextConfigPath)) {
    errors.push("next.config.ts not found at project root.");
  } else {
    const nextConfigText = fs.readFileSync(nextConfigPath, "utf8");
    const hosts = collectRemotePatternHosts(nextConfigText);
    if (!hosts.has("res.cloudinary.com")) {
      errors.push("next.config.ts images.remotePatterns is missing res.cloudinary.com.");
    }
  }

  if (hasTrackedEnvFile()) {
    errors.push("One or more .env* files appear to be tracked by git. Remove and rotate exposed secrets.");
  }

  if (errors.length === 0) {
    console.log("Deploy readiness checks passed.");
  } else {
    console.error("Deploy readiness checks failed:");
    for (const err of errors) {
      console.error(`- ${err}`);
    }
  }

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warn of warnings) {
      console.log(`- ${warn}`);
    }
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main();
