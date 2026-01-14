import path from "node:path";
import { readFile } from "node:fs/promises";
import { readJson, fileExists } from "./utils/fs.js";

/**
 * Validates the full UC -> AC -> Test -> Task chain to ensure we can trace
 * every acceptance criterion back to a real use case and forward to real tests/tasks.
 */
async function main() {
  const spec = await readJson("spec/SPEC.json");
  const tasks = await readJson("tasks/TASKS.json");
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

    if (!Array.isArray(ac.tests) || ac.tests.length === 0) {
      issues.push(`AC ${ac.id} has no associated tests`);
      continue;
    }

    for (const testRef of ac.tests) {
      const [filePath] = testRef.split("#");
      const resolved = path.resolve(filePath);
      if (!(await fileExists(resolved))) {
        issues.push(`Missing test for ${ac.id}: ${filePath}`);
        continue;
      }

      const fileContent = await readFile(resolved, "utf8");
      // Enforce tagging (AC-xx) so we can prove coverage by reading the file.
      if (!fileContent.includes(ac.id)) {
        issues.push(`File ${filePath} does not contain tag ${ac.id}`);
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
