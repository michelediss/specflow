import path from "node:path";
import { promises as fs } from "node:fs";
import { ensureDir, fileExists } from "./utils/fs.js";

// Templates live inside the architect skill so they can be updated alongside the workflow docs.
const TEMPLATE_DIR = path.resolve("toolchain/.codex/skills/specflow-architect/assets/templates");

const FILES = [
  { template: "REQUISITI.template.json", target: "input/REQUISITI.json" },
  { template: "VINCOLI.template.json", target: "input/VINCOLI.json" },
  { template: "STACK.template.json", target: "input/STACK.json" },
  { template: "SPEC.template.json", target: "architect/spec/SPEC.json" },
  { template: "TASKS.template.json", target: "architect/tasks/TASKS.json" },
  { template: "DECISIONS.template.json", target: "architect/decisions/DECISIONS.json" }
];

/**
 * Copies every missing template into the repo without overwriting existing files.
 * This lets newcomers bootstrap the Specflow structure with a single command.
 */
async function main() {
  for (const entry of FILES) {
    const templatePath = path.join(TEMPLATE_DIR, entry.template);
    const targetPath = path.resolve(entry.target);

    if (!(await fileExists(templatePath))) {
      console.warn(`Missing template: ${templatePath}`);
      continue;
    }

    if (await fileExists(targetPath)) {
      console.log(`Skip ${entry.target}: already exists`);
      continue;
    }

    await ensureDir(path.dirname(targetPath));
    const content = await fs.readFile(templatePath, "utf8");
    await fs.writeFile(targetPath, content, "utf8");
    console.log(`Created ${entry.target} from template`);
  }
}

main().catch((error) => {
  console.error("specflow:init failed", error);
  process.exitCode = 1;
});
