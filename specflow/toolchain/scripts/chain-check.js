import path from "node:path";
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { readJson, fileExists } from "./utils/fs.js";

function repoRoot() {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

/**
 * Validates the full UC -> AC -> Test -> Task chain to ensure we can trace
 * every acceptance criterion back to a real use case and forward to real tests/tasks.
 */
async function main() {
  const root = repoRoot();
  const spec = await readJson("architect/spec/SPEC.json");
  const tasks = await readJson("architect/tasks/TASKS.json");
  const issues = [];

  // Without at least one UC the rest of the chain makes no sense.
  if (!Array.isArray(spec.useCases) || spec.useCases.length === 0) {
    issues.push("SPEC: define at least one use case");
  }

  const useCaseIds = new Set((spec.useCases ?? []).map((uc) => uc.id));
  const acceptance = spec.acceptanceCriteria ?? [];
  const acceptanceIds = new Set(acceptance.map((ac) => ac.id));

  for (const ac of acceptance) {
    // AC must point to an existing UC id.
    if (!useCaseIds.has(ac.useCase)) {
      issues.push(`AC ${ac.id} references missing use case ${ac.useCase}`);
    }

    const automatedTests = Array.isArray(ac.tests) ? ac.tests : [];
    const manualTests = Array.isArray(ac.manualTests) ? ac.manualTests : [];
    const externalTests = Array.isArray(ac.externalTests) ? ac.externalTests : [];

    // At least one test must exist: automated (file-based) OR manual OR external.
    if (automatedTests.length + manualTests.length + externalTests.length === 0) {
      issues.push(`AC ${ac.id} has no associated tests (automated/manual/external)`);
      continue;
    }

    // Automated tests must exist on disk and include the AC id tag.
    for (const testRef of automatedTests) {
      const [filePath] = testRef.split("#");
      const resolved = path.resolve(root, filePath);
      if (!(await fileExists(resolved))) {
        issues.push(`Missing automated test for ${ac.id}: ${filePath}`);
        continue;
      }

      const fileContent = await readFile(resolved, "utf8");
      // Enforce tagging (AC-xx) so we can prove coverage by reading the file.
      if (!fileContent.includes(ac.id)) {
        issues.push(`File ${filePath} does not contain tag ${ac.id}`);
      }
    }

    // Manual/external tests are tracked in architect/spec/SPEC.json and can be marked pass/fail/pending.
    // They are not executed by the runner, but they must be well-formed.
    for (const manual of manualTests) {
      if (!manual || typeof manual !== "object") {
        issues.push(`AC ${ac.id} has an invalid manualTests entry (expected object)`);
        continue;
      }
      if (typeof manual.name !== "string" || manual.name.trim() === "") {
        issues.push(`AC ${ac.id} has a manual test with missing name`);
      }
      if (!["pending", "pass", "fail"].includes(manual.status)) {
        issues.push(`AC ${ac.id} manual test '${manual.name ?? "?"}' has invalid status`);
      }
    }

    for (const external of externalTests) {
      if (!external || typeof external !== "object") {
        issues.push(`AC ${ac.id} has an invalid externalTests entry (expected object)`);
        continue;
      }
      if (typeof external.name !== "string" || external.name.trim() === "") {
        issues.push(`AC ${ac.id} has an external test with missing name`);
      }
      if (!["pending", "pass", "fail"].includes(external.status)) {
        issues.push(`AC ${ac.id} external test '${external.name ?? "?"}' has invalid status`);
      }
    }
  }

  for (const task of tasks.tasks ?? []) {
    if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
      issues.push(`Task ${task.id} has no linked AC`);
      continue;
    }

    for (const acId of task.acceptanceCriteria) {
      if (!acceptanceIds.has(acId)) {
        issues.push(`Task ${task.id} references missing AC ${acId}`);
      }
    }
  }

  if (issues.length > 0) {
    console.error("Chain check failed:\n" + issues.map((issue) => ` - ${issue}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Chain check OK");
}

main().catch((error) => {
  console.error("chain-check error", error);
  process.exitCode = 1;
});
