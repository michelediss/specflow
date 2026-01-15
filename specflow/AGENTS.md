# Specflow Operating Guide

This document explains how to adopt and use Specflow inside application repositories. The Spec-Driven Development principles stay the same: truth lives in JSON, `.md` views are generated, every AC has at least one test, and every behavioral change starts from the spec.

Paths below are relative to the repository root.

## Roles and responsibilities

### Architect
- Updates `specflow/input/*.json`, `specflow/input/DB.mmd`, `specflow/architect/spec/SPEC.json`, `specflow/architect/tasks/TASKS.json`, `specflow/architect/decisions/DECISIONS.json`.
- Regenerates the views (`npm --prefix specflow run spec:md`) and validates the chain (`npm --prefix specflow run chain:check`).
- Shares spec changes on `arch/*` branches and uses commit messages like `UC-xx: ...` / `AC-xx: ...`.
- Does not modify application code (`app/src/`, `app/tests/`).

### Developer
- Works on `T-xx` tasks by implementing the minimal code and tests required by the linked AC.
- Uses `npm --prefix specflow run run:task` (or equivalent scripts) for `chain:check + dev:guard + test`.
- Can run `npm --prefix specflow run dev:branch -- --task=T-xx` to create the `dev/*` branch for a task.
- Does not alter the sources of truth (`specflow/input/`, `specflow/architect/`, `specflow/input/DB.mmd`).

## How to reuse the boilerplate

1. **Copy the Specflow folder** into the new repository as `specflow/`.
2. **Install dependencies** for both Specflow and the app:
   ```bash
   npm install --prefix specflow
   npm install --prefix app
   ```
3. **Run `npm --prefix specflow run specflow:init`** if you need empty baseline files. It copies templates into `specflow/input/` and `specflow/architect/` only when files are missing.
4. **Model behavior** by updating JSON under `specflow/input/` and `specflow/architect/`. Each UC should have linked AC, and each AC must list the tests that cover it (e.g., `app/tests/api/user.test.ts#AC-03`).
5. **Regenerate views** with `npm --prefix specflow run spec:md` and ensure the generated docs reflect the new state.
6. **Validate the chain** `UC → AC → Test → Task` with `npm --prefix specflow run chain:check`.
7. **Integrate with the real app:**
   - Reference the real test paths when listing tests inside AC.
   - Use separate commits/branches (Specflow vs app) to keep it clear when you are editing spec vs code.

## Recommended scripts

| Script | Usage | Notes |
| --- | --- | --- |
| `npm --prefix specflow run specflow:init` | Bootstraps missing JSON/MD files. | Only when a file does not exist yet. |
| `npm --prefix specflow run spec:md` | Regenerates all `.md` views. | Required in architect mode before committing. |
| `npm --prefix specflow run chain:check` | Validates UC/AC/Task/Test consistency. | Always run before handing work to developers. |
| `npm --prefix specflow run dev:guard -- --mode=architect` | Prevents touching code/tests while working as architect. | Include in CI for `arch/*` branches. |
| `npm --prefix specflow run dev:guard -- --mode=developer` | Prevents touching sources of truth while working as developer. | Use on `dev/T-xx-*` branches. |
| `npm --prefix specflow run dev:branch -- --task=T-xx` | Creates a `dev/*` branch for a task. | Helps avoid manual branch naming mistakes. |
| `npm --prefix specflow run run:task` | Full developer loop (chain-check + guard + test). | Runs the automated tests configured in the app. |

## Suggested workflow for new projects

1. **Architect**
   - Update `specflow/input/*.json` and `specflow/architect/spec/SPEC.json` to describe the new behavior (e.g., UC-02 checkout). In each AC, reference the test files developers will create in the app.
   - Run `npm --prefix specflow run spec:md`, `npm --prefix specflow run chain:check`, `npm --prefix specflow run dev:guard -- --mode=architect`.
   - Open an `arch/...` PR with updated JSON + generated views.

2. **Developer**
   - Reads `specflow/architect/spec/SPEC.md` and `specflow/architect/decisions/DECISIONS.md` to understand what to implement.
   - Implements tests/code in the app (e.g., `app/tests/checkout.test.ts`), ensuring the required `AC-xx` tags exist.
   - Runs `npm --prefix specflow run chain:check` and `npm --prefix specflow run dev:guard -- --mode=developer`, plus the app’s build/test scripts.
   - Delivers on a `dev/T-xx-*` branch.

## Invariants

- Never edit generated `.md` views by hand.
- Every AC must have at least one test (automated, manual, or external) and reference a valid UC.
- Every `T-xx` task must list the AC it satisfies.
- Decisions are never deleted: mark them as `superseded` when replaced.
- If a rule in this file conflicts with a project-specific instruction, this file wins.

### Manual/external tests

When automated tests are not feasible (external dependencies, staging, UI/hardware), you can declare tests in `specflow/architect/spec/SPEC.json` as:

- `manualTests`: manually executed tests with status `pending|pass|fail`
- `externalTests`: tests executed on an external environment (e.g., staging) with status `pending|pass|fail`
- Manual and external tests can satisfy an AC logically, but do not replace automated tests in CI unless explicitly approved.

These tests are not executed by `npm --prefix app test`, but they are validated by `chain:check` (shape and status).
