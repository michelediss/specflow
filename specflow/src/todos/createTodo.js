import crypto from "node:crypto";

export function createTodo(payload = {}) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";

  if (title.length < 3) {
    return {
      ok: false,
      status: 422,
      error: {
        code: "TITLE_REQUIRED",
        message: "Title is required and must be at least 3 characters long"
      }
    };
  }

  return {
    ok: true,
    status: 201,
    data: {
      id: crypto.randomUUID(),
      title,
      description: typeof payload.description === "string" ? payload.description : ""
    }
  };
}
