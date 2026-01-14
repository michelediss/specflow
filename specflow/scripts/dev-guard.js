import { execSync } from "node:child_process";

const modeFlag = process.argv.find((arg) => arg.startsWith("--mode"));
const mode = modeFlag ? modeFlag.split("=")[1] : undefined;

if (!mode) {
  console.error("Specify --mode=architect|developer");
  process.exit(1);
}

/**
 * Reads the working tree status (including staged files) by parsing
 * the porcelain output of git status (two-letter status + path).
 */
function getChangedFiles() {
  try {
    const diff = execSync("git status --porcelain", { encoding: "utf8" });
    return diff
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(3));
  } catch (error) {
    console.warn("Unable to determine git status", error.message);
    return [];
  }
}

/**
 * Architect mode forbids touching implementation/tests to keep the spec pipeline isolated.
 */
function enforceArchitect(files) {
  const forbidden = files.filter((file) => file.startsWith("src/") || file.startsWith("tests/"));
  if (forbidden.length > 0) {
    throw new Error(`Architect mode: forbidden files\n${forbidden.join("\n")}`);
  }
}

/**
 * Developer mode forbids editing the single source of truth (inputs/spec/tasks/decisions + DB schema).
 */
function enforceDeveloper(files) {
  const forbiddenPrefixes = ["inputs/", "spec/", "decisions/", "tasks/", "inputs/DB.mmd"];
  const violations = files.filter((file) =>
    forbiddenPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))
  );
  if (violations.length > 0) {
    throw new Error(`Developer mode: forbidden files\n${violations.join("\n")}`);
  }
}

try {
  const files = getChangedFiles();
  if (mode === "architect") {
    enforceArchitect(files);
  } else if (mode === "developer") {
    enforceDeveloper(files);
  } else {
    throw new Error(`Unknown mode: ${mode}`);
  }
  console.log(`dev-guard (${mode}) OK`);
} catch (error) {
  console.error("dev-guard failed", error.message);
  process.exit(1);
}
