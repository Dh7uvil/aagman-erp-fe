/**
 * Copy the backend permission catalog snapshot and regenerate frontend types.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feRoot = path.join(__dirname, "..");
const beRoot = process.env.BE_REPO_PATH
  ? path.resolve(process.env.BE_REPO_PATH)
  : path.join(feRoot, "../aagman-erp-be");
const beCatalogJson = path.join(beRoot, "docs/permissions-catalog.json");
const vendoredCatalogJson = path.join(feRoot, "src/shared/lib/permissions-catalog.json");

const optional = process.argv.includes("--optional");

if (!fs.existsSync(beCatalogJson)) {
  const message =
    "Backend catalog snapshot not found at:\n" +
    `  ${beCatalogJson}\n\n` +
    "Set BE_REPO_PATH or check out aagman-erp-be beside the frontend.";
  if (optional) {
    console.warn(message);
    process.exit(0);
  }
  console.error(message);
  process.exit(1);
}

fs.mkdirSync(path.dirname(vendoredCatalogJson), { recursive: true });
fs.copyFileSync(beCatalogJson, vendoredCatalogJson);
console.log(`Copied ${beCatalogJson} -> ${vendoredCatalogJson}`);

const result = spawnSync("node", ["scripts/generate-fe-permissions.mjs"], {
  cwd: feRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
