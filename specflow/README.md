# Specflow

Specflow is a reference implementation of Spec-Driven Development. JSON files are the single source of truth, Markdown views are generated, every AC has at least one test, and behavior changes follow the order: spec → test → code.

## Project layout (full boilerplate)

```
maindir/
├─ .github/workflows/ci.yml          # CI pipeline running Specflow checks + app tests
├─ README.md                         # repo overview
├─ LICENSE                           # root license (repo-wide)
├─ specflow/
│  ├─ README.md                      # this document
│  ├─ LICENSE                        # license specific to Specflow assets
│  ├─ AGENTS.md                      # operating guide (roles, workflow, CI)
│  ├─ AGENTS.backup.md               # backup of a previous AGENTS.md
│  ├─ package.json                   # Specflow scripts (chain-check, guard, md)
│  ├─ input/                         # manual inputs (sources of truth)
│  │  ├─ REQUISITI.json              # functional requirements
│  │  ├─ VINCOLI.json                # constraints and non-negotiables
│  │  ├─ STACK.json                  # runtime/framework/DB/tooling
│  │  ├─ DB.mmd                      # Mermaid ER diagram (DB contract)
│  │  ├─ REQUISITI.md                # generated view (do not edit)
│  │  ├─ VINCOLI.md                  # generated view (do not edit)
│  │  └─ STACK.md                    # generated view (do not edit)
│  ├─ architect/                     # project truth (machine-readable)
│  │  ├─ spec/
│  │  │  ├─ SPEC.json                # use cases, AC, contracts, flows, DB
│  │  │  └─ SPEC.md                  # generated view (do not edit)
│  │  ├─ tasks/
│  │  │  ├─ TASKS.json               # tasks linked to AC
│  │  │  └─ TASKS.md                 # generated view (do not edit)
│  │  └─ decisions/
│  │     ├─ DECISIONS.json           # decision log (status, reasons, consequences)
│  │     └─ DECISIONS.md             # generated view (do not edit)
│  ├─ toolchain/                     # tooling that powers Specflow
│  │  ├─ scripts/
│  │  │  ├─ specflow-init.js          # bootstrap missing JSON files from templates
│  │  │  ├─ chain-check.js            # validate UC → AC → tests → tasks
│  │  │  ├─ tests-map.js              # report AC → tests coverage and status
│  │  │  ├─ dev-guard.js              # block forbidden changes per role
│  │  │  ├─ dev-branch.js             # create dev/* branch from a T-xx
│  │  │  ├─ generate-md.js            # build Markdown views from JSON
│  │  │  └─ utils/                    # file and formatting helpers
│  │  ├─ schemas/                    # JSON schema references
│  │  │  ├─ requisiti.schema.json
│  │  │  ├─ vincoli.schema.json
│  │  │  ├─ stack.schema.json
│  │  │  ├─ spec.schema.json
│  │  │  ├─ tasks.schema.json
│  │  │  └─ decisions.schema.json
│  │  └─ .codex/                      # Codex skills used by Specflow
│  │     └─ skills/
│  │        ├─ specflow-architect/
│  │        └─ specflow-developer/
└─ app/
   ├─ src/                            # application code (example)
   ├─ tests/                          # application tests (example)
   └─ package.json                    # app scripts (e.g., vitest)
```

Generated Markdown views (`*.md`) mirror the JSON files and must never be edited manually.

## Glossary of IDs (sigle)

These are the IDs used across the JSON files to link requirements, use cases, acceptance criteria, tasks, and contracts.

- `RQ-xx` (Requirement): functional requirement in `specflow/input/REQUISITI.json` (`functionalRequirements[].id`).
- `UC-xx` (Use Case): use case in `specflow/architect/spec/SPEC.json` (`useCases[].id`).
- `AC-xx` (Acceptance Criteria): verifiable criterion in `specflow/architect/spec/SPEC.json` (`acceptanceCriteria[].id`), linked to a `UC-xx` and at least one test entry.
- `T-xx` (Task): atomic task in `specflow/architect/tasks/TASKS.json` (`tasks[].id`), linked to one or more `AC-xx`.
- `D-xx` (Decision): architectural decision in `specflow/architect/decisions/DECISIONS.json` (`decisions[].id`).
- `V-xx` (Constraint): constraint in `specflow/input/VINCOLI.json` (`constraints[].id`).
- `API-xx` (API Contract): API contract in `specflow/architect/spec/SPEC.json` (`contracts.apis[].id`).
- `OP-xx` (Operation): internal operation in `specflow/architect/spec/SPEC.json` (`operations[].id`), linked to one or more `AC-xx`.
- `DF-xx` (Data Flow): data flow in `specflow/architect/spec/SPEC.json` (`dataFlows[].id`), linked to a `UC-xx`.

Notes on test types inside AC:
- `acceptanceCriteria[].tests`: automated tests (repo-root file path + `#AC-xx`), executed by `npm --prefix app test`.
- `acceptanceCriteria[].manualTests`: manual tests tracked in the spec with `status: pending|pass|fail`.
- `acceptanceCriteria[].externalTests`: tests run in external environments (e.g., staging) tracked in the spec with `status: pending|pass|fail`.

## Prerequisites

- Node.js 20+
- npm
- Codex CLI configured to run the `$specflow-architect` or `$specflow-developer` skills (see `specflow/toolchain/.codex/skills` and `~/.codex/prompts`).

Install dependencies once network access is available:

```bash
npm install --prefix specflow
npm install --prefix app
```

## Script catalog

Run scripts from the repo root using `--prefix specflow` (or `cd specflow` first).

| Script | Purpose | When to run |
| --- | --- | --- |
| `npm --prefix specflow run specflow:init` | Copies the latest templates from `specflow/toolchain/.codex/skills/specflow-architect/assets/templates` into `specflow/input/` and `specflow/architect/`. Skips existing files. | First-time setup or onboarding. Architect-only. |
| `npm --prefix specflow run spec:md` | Converts every JSON source into the corresponding Markdown view. | After any JSON change in architect mode. Also part of CI. |
| `npm --prefix specflow run chain:check` | Validates UC → AC → Task links, ensures each AC has coverage (automated/manual/external), and checks automated tests exist and contain the `AC-xx` tag. | Before every commit and inside CI. |
| `npm --prefix specflow run dev:guard -- --mode=architect` | Ensures there are no working changes in `app/src/` or `app/tests/`. | Architect mode, before commits or in CI on `arch/*` branches. |
| `npm --prefix specflow run dev:guard -- --mode=developer` | Blocks modifications to `specflow/input/`, `specflow/architect/`, and `specflow/input/DB.mmd`. | Developer mode, before commits or in CI on `dev/*` branches. |
| `npm --prefix specflow run dev:branch -- --task=T-xx` | Creates a `dev/*` git branch for a task in `specflow/architect/tasks/TASKS.json` (optionally checks it out). | Start of developer work on a `T-xx`. |
| `npm --prefix specflow run run:task` | Shortcut for the developer loop: `chain:check + dev:guard + app tests`. | Developer mode when implementing a `T-xx`. |
| `npm --prefix specflow test` | Runs automated tests in `app/`. | Any time automated tests need to run. |

### Script internals (plain language)

- `toolchain/scripts/specflow-init.js` copies templates (if missing) into `specflow/input/` and `specflow/architect/`.
- `toolchain/scripts/generate-md.js` reads the JSON sources and writes the generated Markdown views next to them.
- `toolchain/scripts/chain-check.js` verifies the UC/AC/Test/Task chain, including test file existence and the `AC-xx` tag.
- `toolchain/scripts/tests-map.js` prints a readable AC → tests report with automated/manual/external status.
- `toolchain/scripts/dev-guard.js` blocks edits that are out of scope for the current role (architect vs developer).
- `toolchain/scripts/dev-branch.js` creates a `dev/T-xx-<slug>` branch from the task title.

## Test types in `specflow/architect/spec/SPEC.json`

Each `acceptanceCriteria[]` can declare coverage in three ways:

- `tests`: automated tests (`path/to/test.ts#AC-xx`). These must exist on disk and contain the `AC-xx` tag.
- `manualTests`: manual checks tracked in the spec with `status: pending|pass|fail`.
- `externalTests`: checks run in an external environment (e.g., staging) tracked in the spec with `status: pending|pass|fail` plus optional `environment`/`evidence`.

Minimal example:

```json
{
  "id": "AC-10",
  "useCase": "UC-02",
  "given": "...",
  "when": "...",
  "then": "...",
  "tests": ["app/tests/checkout.test.ts#AC-10"],
  "manualTests": [{ "name": "QA checklist checkout", "status": "pending" }],
  "externalTests": [{ "name": "Staging smoke", "environment": "staging", "status": "pass" }]
}
```

Notes:
- `npm --prefix app test` only runs `tests` (automated).
- `npm --prefix specflow run chain:check` validates that every AC has at least one test entry (any type) and that automated test files exist.

## Working modes

### Architect

1. Work on an `arch/*` branch.
2. Update `specflow/input/*.json`, `specflow/input/DB.mmd`, `specflow/architect/spec/SPEC.json`, `specflow/architect/tasks/TASKS.json`, and `specflow/architect/decisions/DECISIONS.json`.
3. Run `npm --prefix specflow run spec:md` to refresh all views.
4. Execute `npm --prefix specflow run chain:check`.
5. Run `npm --prefix specflow run dev:guard -- --mode=architect` before committing.

### Developer

1. Work on a `dev/T-xx-*` branch.
2. Read `specflow/architect/spec/SPEC.md` and `specflow/architect/decisions/DECISIONS.md` to understand the AC you need to implement.
3. Modify only `app/src/` and `app/tests/`.
4. Use `npm --prefix specflow run run:task` until tests pass.
5. Keep the `AC-xx` markers in your tests so `chain:check` succeeds.

## CI recommendations

The repo-level workflow `.github/workflows/ci.yml` performs the following steps:

1. `npm install --prefix specflow`
2. `npm install --prefix app`
3. `npm --prefix specflow run chain:check`
4. `npm --prefix specflow run dev:guard -- --mode=architect|developer` (mode derived from branch name)
5. `npm --prefix specflow run spec:md` and `git diff --exit-code`
6. `npm --prefix specflow test`

This mirrors the expected local workflow and guarantees that JSON and Markdown never diverge.

## Git (mini cheat sheet)

Minimal path to work with branches + PRs (no Git expertise required).

### 6 core commands

From the repo root:

- See your current branch and what changed: `git status`
- Create and switch to a new branch: `git checkout -b arch/UC-02-checkout` or `git checkout -b dev/T-05-implement-AC-10`
- (Alternative for dev tasks) Create a branch from a task: `npm --prefix specflow run dev:branch -- --task=T-05`
- Inspect changes (optional): `git diff`
- Stage files for commit: `git add .` (or `git add <file>` to be more selective)
- Commit: `git commit -m "T-05: implement AC-10"`

## Notes about automation

- Specflow does not create branches automatically unless you run `npm --prefix specflow run dev:branch`.
- Specflow does not create PRs; that still happens via GitHub/GitLab UI or CLI.
- CI verifies that generated Markdown stays in sync and that tests pass before merging.
