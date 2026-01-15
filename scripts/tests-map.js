import path from "node:path";
import { execSync } from "node:child_process";
import { readJson, fileExists } from "./utils/fs.js";

function repoRoot() {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

/**
 * Prints a quick report:
 * - automated tests: whether referenced files exist
 * - manual/external tests: their current status (pending/pass/fail)
 *
 * This is a cheaper companion to chain-check (no file content inspection).
 */
async function main() {
  const root = repoRoot();
  const spec = await readJson("spec/spec.json");
  const acceptance = spec.acceptanceCriteria ?? [];

  const rows = await Promise.all(
    acceptance.map(async (ac) => {
      const automatedRefs = await Promise.all(
        (ac.tests ?? []).map(async (ref) => {
          const [filePath] = ref.split("#");
          const status = (await fileExists(path.resolve(root, filePath))) ? "ok" : "missing";
          return `${ref} (${status})`;
        })
      );

      const manual = (ac.manualTests ?? []).map((t) => `${t.name} [${t.status}]`);
      const external = (ac.externalTests ?? []).map((t) => `${t.name} [${t.status}]`);

      const parts = [];
      if (automatedRefs.length > 0) parts.push(`automated: ${automatedRefs.join(", ")}`);
      if (manual.length > 0) parts.push(`manual: ${manual.join(", ")}`);
      if (external.length > 0) parts.push(`external: ${external.join(", ")}`);

      return `- ${ac.id}: ${parts.join(" | ")}`;
    })
  );

  console.log("AC -> Test map:\n" + rows.join("\n"));
}

main().catch((error) => {
  console.error("tests-map failed", error);
  process.exitCode = 1;
});
