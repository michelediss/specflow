import { promises as fs } from "node:fs";
import path from "node:path";

export async function readJson(filePath) {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const serialized = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(filePath, serialized, "utf8");
}

export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

export async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(resolved);
      }
      return resolved;
    })
  );
  return files.flat();
}
