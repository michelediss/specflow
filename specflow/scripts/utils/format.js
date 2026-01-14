export function heading(level, text) {
  return `${"#".repeat(level)} ${text}`;
}

export function bullet(text, indent = 0) {
  return `${"  ".repeat(indent)}- ${text}`;
}

export function section(title, content) {
  return `${heading(2, title)}\n\n${content.trim()}\n`;
}

export function listSection(title, values) {
  if (!values || values.length === 0) {
    return `${heading(3, title)}\n\n*(empty)*\n`;
  }
  const lines = values.map((value) => bullet(value));
  return `${heading(3, title)}\n\n${lines.join("\n")}\n`;
}
