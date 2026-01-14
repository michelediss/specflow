import { describe, it, expect } from "vitest";
import { createTodo } from "../../src/todos/createTodo.js";

describe("POST /todos", () => {
  it("AC-01 creates a valid to-do", () => {
    const result = createTodo({ title: "Buy milk", description: "2L" });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
    expect(result.data.title).toBe("Buy milk");
  });

  it("AC-02 rejects missing title", () => {
    const result = createTodo({ title: "" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(422);
    expect(result.error.code).toBe("TITLE_REQUIRED");
  });
});
