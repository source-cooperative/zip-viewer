import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(repoRoot, "node_modules", "streamsaver");
const destDir = path.join(repoRoot, "static", "streamsaver");
const assets = ["mitm.html", "sw.js"];

const sourcePaths = assets.map((asset) => path.join(sourceDir, asset));
const destPaths = assets.map((asset) => path.join(destDir, asset));

const sourcesExist = async () => {
  try {
    await Promise.all(sourcePaths.map((source) => fs.access(source)));
    return true;
  } catch {
    return false;
  }
};

const copyAssets = async () => {
  await fs.mkdir(destDir, { recursive: true });
  await Promise.all(
    sourcePaths.map((source, index) => fs.copyFile(source, destPaths[index]))
  );
};

const main = async () => {
  if (!(await sourcesExist())) {
    console.warn(
      "[streamsaver] Assets missing in node_modules. Skipping copy; blob fallback will be used."
    );
    return;
  }

  await copyAssets();
  console.info(`[streamsaver] Copied assets to ${destDir}`);
};

try {
  await main();
} catch (error) {
  console.error("[streamsaver] Failed to copy assets.", error);
  process.exitCode = 1;
}
