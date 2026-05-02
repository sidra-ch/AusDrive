#!/usr/bin/env node
/**
 * Pushes all .env.local variables to Vercel using REST API (fast, no CLI stdin issues)
 * Usage: node scripts/push-env-to-vercel.mjs
 */
import { readFileSync } from "fs";

// Read Vercel credentials
const auth = JSON.parse(readFileSync(`${process.env.APPDATA}\\com.vercel.cli\\Data\\auth.json`, "utf8"));
const proj = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
const TOKEN = auth.token;
const PROJECT_ID = proj.projectId;
const TEAM_ID = proj.orgId;

// Parse .env.local
const envContent = readFileSync(".env.local", "utf8");
const vars = envContent
  .split("\n")
  .map(l => l.trim())
  .filter(l => l && !l.startsWith("#") && l.includes("="))
  .map(l => {
    const eq = l.indexOf("=");
    return { key: l.slice(0, eq).trim(), value: l.slice(eq + 1).trim() };
  })
  .filter(v => v.key && v.value);

console.log(`\nPushing ${vars.length} variables to Vercel project ${PROJECT_ID}...\n`);

const targets = ["production", "preview", "development"];
let success = 0, failed = 0;

for (const { key, value } of vars) {
  const body = JSON.stringify({ key, value, type: "encrypted", target: targets });
  const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (res.ok) {
      console.log(`✓ ${key}`);
      success++;
    } else {
      const err = await res.json().catch(() => ({}));
      console.error(`✗ ${key} — ${err?.error?.message ?? res.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`✗ ${key} — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${success} added, ${failed} failed`);

// Trigger redeploy
console.log("\nTriggering production redeploy...");
const deployRes = await fetch(`https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "ausdrive-premium", gitSource: { type: "github", ref: "main", repoId: proj.gitSource?.repoId ?? "" } }),
});
if (deployRes.ok) {
  const d = await deployRes.json();
  console.log(`✓ Redeploy triggered: ${d.url ?? "check Vercel dashboard"}`);
} else {
  console.log("ℹ  Go to Vercel Dashboard → Deployments → Redeploy latest");
}
