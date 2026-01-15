import { readJson, writeText } from "./utils/fs.js";
import { heading, bullet } from "./utils/format.js";

/**
 * Requirements view mirrors inputs/REQUISITI.json to let humans scan the spec without touching JSON.
 */
async function generateRequirements() {
  const data = await readJson("inputs/REQUISITI.json");
  const lines = [heading(1, "REQUIREMENTS"), ""];

  lines.push(heading(2, "Meta"));
  for (const [key, value] of Object.entries(data.meta ?? {})) {
    lines.push(bullet(`${key}: ${value}`));
  }

  lines.push("", heading(2, "Functional Requirements"));
  if ((data.functionalRequirements ?? []).length === 0) {
    lines.push("*(empty)*");
  } else {
    for (const req of data.functionalRequirements) {
      lines.push(heading(3, `${req.id} - ${req.title}`));
      lines.push(req.description ?? "", bullet(`AC: ${(req.acceptanceCriteria ?? []).join(", ")}`), "");
    }
  }

  await writeText("inputs/REQUISITI.md", lines.join("\n").trim() + "\n");
}

/**
 * Constraints view exposes legal/budget/tech constraints in plain Markdown.
 */
async function generateConstraints() {
  const data = await readJson("inputs/VINCOLI.json");
  const lines = [heading(1, "CONSTRAINTS"), "", heading(2, "List")];
  for (const constraint of data.constraints ?? []) {
    lines.push(heading(3, `${constraint.id} (${constraint.type})`));
    lines.push(constraint.description ?? "", "");
  }
  await writeText("inputs/VINCOLI.md", lines.join("\n").trim() + "\n");
}

/**
 * Stack view summarizes runtime/framework/DB choices for quick inspection.
 */
async function generateStack() {
  const data = await readJson("inputs/STACK.json");
  const lines = [heading(1, "STACK"), ""];
  for (const [group, values] of Object.entries(data)) {
    lines.push(heading(2, group));
    for (const [key, value] of Object.entries(values ?? {})) {
      lines.push(bullet(`${key}: ${value}`));
    }
    lines.push("");
  }
  await writeText("inputs/STACK.md", lines.join("\n").trim() + "\n");
}

/**
 * Spec view stitches together UC/AC/contracts/flows/db to produce SPEC.md.
 */
async function generateSpec() {
  const spec = await readJson("spec/SPEC.json");
  const lines = [heading(1, "SPEC"), ""];
  lines.push(heading(2, "Meta"));
  for (const [key, value] of Object.entries(spec.meta ?? {})) {
    lines.push(bullet(`${key}: ${value}`));
  }

  lines.push("", heading(2, "Scope"));
  lines.push(heading(3, "In"));
  (spec.scope?.in ?? []).forEach((item) => lines.push(bullet(item)));
  lines.push(heading(3, "Out"));
  (spec.scope?.out ?? []).forEach((item) => lines.push(bullet(item)));

  lines.push("", heading(2, "Use Cases"));
  for (const uc of spec.useCases ?? []) {
    lines.push(heading(3, `${uc.id} - ${uc.title}`));
    lines.push(bullet(`Actor: ${uc.actor}`));
    lines.push(heading(4, "Main Flow"));
    (uc.mainFlow ?? []).forEach((step) => lines.push(bullet(step)));
    lines.push(heading(4, "Alternative Flows"));
    (uc.alternativeFlows ?? []).forEach((step) => lines.push(bullet(step)));
  }

  lines.push("", heading(2, "Acceptance Criteria"));
  for (const ac of spec.acceptanceCriteria ?? []) {
    lines.push(heading(3, `${ac.id} -> ${ac.useCase}`));
    lines.push(bullet(`Given: ${ac.given}`));
    lines.push(bullet(`When: ${ac.when}`));
    lines.push(bullet(`Then: ${ac.then}`));
    lines.push(bullet(`Automated tests: ${(ac.tests ?? []).join(", ")}`));

    const manual = (ac.manualTests ?? []).map((t) => `${t.name} [${t.status}]`);
    if (manual.length > 0) {
      lines.push(bullet(`Manual tests: ${manual.join(", ")}`));
    }

    const external = (ac.externalTests ?? []).map((t) => `${t.name} [${t.status}]`);
    if (external.length > 0) {
      lines.push(bullet(`External tests: ${external.join(", ")}`));
    }
  }

  lines.push("", heading(2, "Contracts"));
  for (const api of spec.contracts?.apis ?? []) {
    lines.push(heading(3, `${api.id} ${api.method} ${api.path}`));
    lines.push(bullet(`Errors: ${(api.errors ?? []).map((err) => `${err.status}:${err.code}`).join(", ")}`));
  }

  lines.push("", heading(2, "Services"));
  for (const service of spec.services ?? []) {
    lines.push(heading(3, service.name));
    (service.responsibilities ?? []).forEach((res) => lines.push(bullet(res)));
  }

  lines.push("", heading(2, "Operations"));
  for (const op of spec.operations ?? []) {
    lines.push(heading(3, `${op.id} - ${op.name}`));
    lines.push(bullet(`Service: ${op.service}`));
    lines.push(bullet(`AC: ${(op.acceptanceCriteria ?? []).join(", ")}`));
  }

  lines.push("", heading(2, "Data Flows"));
  for (const df of spec.dataFlows ?? []) {
    lines.push(heading(3, `${df.id} - ${df.useCase}`));
    (df.steps ?? []).forEach((step) => lines.push(bullet(step)));
    if (df.diagramMermaid) {
      lines.push("```mermaid", df.diagramMermaid, "```");
    }
  }

  lines.push("", heading(2, "Database"));
  for (const table of spec.db?.tables ?? []) {
    lines.push(heading(3, table.name));
    (table.columns ?? []).forEach((col) => lines.push(bullet(`${col.name} ${col.type}`)));
  }

  await writeText("spec/SPEC.md", lines.join("\n").trim() + "\n");
}

/**
 * Task view gives developers a human-friendly list of T-xx with linked AC/file hints.
 */
async function generateTasks() {
  const tasks = await readJson("tasks/TASKS.json");
  const lines = [heading(1, "TASKS"), ""];
  for (const task of tasks.tasks ?? []) {
    lines.push(heading(2, `${task.id} - ${task.title}`));
    lines.push(bullet(`AC: ${(task.acceptanceCriteria ?? []).join(", ")}`));
    lines.push(bullet(`Files: ${(task.files ?? []).join(", ")}`));
  }
  await writeText("tasks/TASKS.md", lines.join("\n").trim() + "\n");
}

/**
 * Decision view summarizes the ADR log (status/date) for quick reference.
 */
async function generateDecisions() {
  const decisions = await readJson("decisions/DECISIONS.json");
  const lines = [heading(1, "DECISIONS"), ""];
  for (const decision of decisions.decisions ?? []) {
    lines.push(heading(2, `${decision.id} - ${decision.title}`));
    lines.push(bullet(`Status: ${decision.status}`));
    lines.push(bullet(`Date: ${decision.date}`));
  }
  await writeText("decisions/DECISIONS.md", lines.join("\n").trim() + "\n");
}

async function main() {
  await generateRequirements();
  await generateConstraints();
  await generateStack();
  await generateSpec();
  await generateTasks();
  await generateDecisions();
}

main().catch((error) => {
  console.error("generate-md failed", error);
  process.exitCode = 1;
});
