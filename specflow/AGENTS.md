# Specflow Operating Guide

This document explains how to adopt and use the Specflow boilerplate inside new application projects (e.g., a Vue app). The Spec-Driven Development principles stay the same: truth lives in JSON, `.md` views are generated, every AC has at least one test, and every behavioral change starts from the spec.

## Roles and responsibilities

### Architect
- Updates `inputs/*.json`, `inputs/db.mmd`, `spec/spec.json`, `tasks/tasks.json`, `decisions/decisions.json`.
- Regenerates the views (`npm run spec:md`) and validates the chain (`npm run chain:check`).
- Shares spec changes on `arch/*` branches and uses commit messages like `UC-xx: ...` / `AC-xx: ...`.
- Does not modify the application code (the real app `app/src/`, `app/tests/`).

### Developer
- Works on `T-xx` tasks by implementing the minimal code and tests required by the linked AC.
- Uses `npm run run:task` (or equivalent scripts) for `chain:check + dev:guard + test`.
- Can run `npm run dev:branch -- --task=T-xx` to automatically create the `dev/*` branch for a task.
- Does not alter the sources of truth (`specflow/inputs/`, `specflow/spec/`, `specflow/tasks/`, `specflow/decisions/`, `specflow/inputs/db.mmd`).

## How to reuse the boilerplate

1. **Clone or copy the `specflow/` folder** into the new repository (or keep it as a subfolder next to an existing app).
2. **Install dependencies** inside `specflow/`:
   ```bash
   cd specflow
   npm install
   ```
3. **Run `npm run specflow:init`** if you need empty baseline files. It copies templates into `inputs/`, `spec/`, `tasks/`, `decisions/` only when files are missing.
4. **Model behavior** by updating JSON under `inputs/` and `spec/`. Each UC should have linked AC, and each AC must list the tests that cover it (e.g., `tests/api/user.test.ts#AC-03`).
5. **Regenerate views** with `npm run spec:md` and ensure the generated docs reflect the new state.
6. **Validate the chain** `UC → AC → Test → Task` with `npm run chain:check`.
7. **Integrate with the real app:**
   - If the app lives in another folder (`frontend/`, `backend/`, etc.), reference the real paths when listing tests inside AC.
   - Use separate commits/branches (Specflow vs app) to keep it clear when you are editing spec vs code.

## Recommended scripts

| Script | Usage | Notes |
| --- | --- | --- |
| `npm run specflow:init` | Bootstraps missing JSON/MD files. | Only when a file does not exist yet. |
| `npm run spec:md` | Regenerates all `.md` views. | Required in architect mode before committing. |
| `npm run chain:check` | Validates UC/AC/Task/Test consistency. | Always run before handing work to developers. |
| `npm run dev:guard -- --mode=architect` | Prevents touching code/tests while working as architect. | Include in CI for `arch/*` branches. |
| `npm run dev:guard -- --mode=developer` | Prevents touching sources of truth while working as developer. | Use on `dev/T-xx-*` branches. |
| `npm run dev:branch -- --task=T-xx` | Creates a `dev/*` branch for a task. | Helps avoid manual branch naming mistakes. |
| `npm run run:task` | Full developer loop (chain-check + guard + test). | Runs the automated tests configured in the project. |

## Suggested workflow for new projects

1. **Architect**
   - Update `inputs/*.json` and `spec/spec.json` to describe the new behavior (e.g., UC-02 checkout). In each AC, reference the test files developers will create in the app.
   - Run `npm run spec:md`, `npm run chain:check`, `npm run dev:guard -- --mode=architect`.
   - Open an `arch/...` PR with updated JSON + generated views.

2. **Developer**
   - Reads `spec/spec.md` and `decisions/decisions.md` to understand what to implement.
   - Implements tests/code in the real app (e.g., `frontend/tests/checkout.spec.ts`), ensuring the required `AC-xx` tags exist.
   - Runs `npm run chain:check` (to ensure referenced test files exist) and `npm run dev:guard -- --mode=developer` (from the Specflow folder), plus the app’s build/test scripts.
   - Delivers on a `dev/T-xx-*` branch.

## Coordinating Specflow with a Vue app (example)

- Keep two `package.json`: one in `specflow/` (Specflow) and one at the repo root or in `frontend/` (Vue).
- Git-wise, you can use two parallel branch sets (`arch/...` for Specflow, `feature/...` for the app) or coordinate changes via PRs.
- When listing tests in AC, use real Vue test paths, e.g. `frontend/tests/components/cart.test.ts#AC-05`.
- If you want everything to run in CI, add steps that run the Specflow scripts (chain/guard/md) first, then the app pipeline.

## Invariants

- Never edit generated `.md` views by hand.
- Every AC must have at least one test (automated, manual, or external) and reference a valid UC.
- Every `T-xx` task must list the AC it satisfies.
- Decisions are never deleted: mark them as `superseded` when replaced.
- If a rule in this file conflicts with a project-specific instruction, this file wins.

### Manual/external tests

When automated tests are not feasible (external dependencies, staging, UI/hardware), you can declare tests in `spec/spec.json` as:

- `manualTests`: manually executed tests with status `pending|pass|fail`
- `externalTests`: tests executed on an external environment (e.g., staging) with status `pending|pass|fail`
- Manual and external tests can satisfy an AC logically, but do not replace automated tests in CI unless explicitly approved.

These tests are not executed by `npm test`, but they are validated by `chain:check` (shape and status).
