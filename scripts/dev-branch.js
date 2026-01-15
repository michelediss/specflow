import { execSync } from "node:child_process";
import { readJson } from "./utils/fs.js";

function getArgValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function runStreaming(command) {
  execSync(command, { stdio: "inherit" });
}

function branchExistsLocally(branchName) {
  try {
    run(`git rev-parse --verify ${branchName}`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const taskId = getArgValue("task");
  const checkoutValue = getArgValue("checkout");
  const shouldCheckout = checkoutValue ? checkoutValue !== "false" : true;

  if (!taskId) {
    console.error("Missing required argument: --task=T-xx");
    process.exit(1);
  }

  const tasks = await readJson("tasks/tasks.json");
  const task = (tasks.tasks ?? []).find((item) => item.id === taskId);
  if (!task) {
    console.error(`Task not found: ${taskId}`);
    process.exit(1);
  }

  const titleSlug = slugify(task.title ?? "");
  const branchName = titleSlug ? `dev/${taskId}-${titleSlug}` : `dev/${taskId}`;

  if (branchExistsLocally(branchName)) {
    console.log(`Branch already exists: ${branchName}`);
    if (shouldCheckout) {
      runStreaming(`git checkout ${branchName}`);
    }
    console.log(`Task: ${taskId} - ${task.title ?? ""}`);
    return;
  }

  runStreaming(`git branch ${branchName}`);
  console.log(`Created branch: ${branchName}`);

  if (shouldCheckout) {
    runStreaming(`git checkout ${branchName}`);
  }

  console.log(`Task: ${taskId} - ${task.title ?? ""}`);
  if (Array.isArray(task.acceptanceCriteria) && task.acceptanceCriteria.length > 0) {
    console.log(`AC: ${task.acceptanceCriteria.join(", ")}`);
  }
  if (Array.isArray(task.files) && task.files.length > 0) {
    console.log(`Files: ${task.files.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("dev-branch failed", error);
  process.exitCode = 1;
});
