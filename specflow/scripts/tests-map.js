import path from "node:path";
import { readJson, fileExists } from "./utils/fs.js";

/**
 * Prints a quick report showing whether each AC's referenced test files exist.
 * This is a cheaper companion to chain-check (no file content inspection).
 */
async function main() {
  const spec = await readJson("spec/SPEC.json");
  const acceptance = spec.acceptanceCriteria ?? [];

  const rows = await Promise.all(
    acceptance.map(async (ac) => {
      const refs = await Promise.all(
        (ac.tests ?? []).map(async (ref) => {
          const [filePath] = ref.split("#");
          const status = (await fileExists(path.resolve(filePath))) ? "ok" : "missing";
          return `${ref} (${status})`;
        })
      );
      return `- ${ac.id}: ${refs.join(", ")}`;
    })
  );

  console.log("AC -> Test map:\n" + rows.join("\n"));
}

main().catch((error) => {
  console.error("tests-map failed", error);
  process.exitCode = 1;
});
