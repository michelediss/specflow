# Specflow

Specflow is a reference implementation of the Spec-Driven Development workflow described in `AGENTS.md`. Everything revolves around JSON sources of truth and a deterministic toolchain that keeps the spec, tasks, decisions, and code in sync.

> All paths below are relative to the `specflow/` directory. Run every npm command from here.

## Project layout

```
inputs/        # manual sources of truth (requirements, constraints, stack, DB)
spec/          # machine-readable spec (UC, AC, flows, contracts)
tasks/         # granular tasks tied to AC ids
decisions/     # architectural decisions with status history
scripts/       # Specflow automation (init, guardrails, markdown generation, checks)
schemas/       # JSON Schemas for validation/reference
.codex/        # repo-scoped skills and templates
```

Generated Markdown views (`*.md`) mirror the JSON files and must never be edited manually.

## Glossary of IDs (sigle)

These are the IDs used across the JSON files to link requirements, use cases, acceptance criteria, tasks, and contracts.

- `RQ-xx` (Requirement): functional requirement in `inputs/requirements.json` (`functionalRequirements[].id`).
- `UC-xx` (Use Case): use case in `spec/spec.json` (`useCases[].id`).
- `AC-xx` (Acceptance Criteria): verifiable criterion in `spec/spec.json` (`acceptanceCriteria[].id`), linked to a `UC-xx` and at least one test entry.
- `T-xx` (Task): atomic task in `tasks/tasks.json` (`tasks[].id`), linked to one or more `AC-xx`.
- `D-xx` (Decision): architectural decision in `decisions/decisions.json` (`decisions[].id`).
- `V-xx` (Constraint): constraint in `inputs/constraints.json` (`constraints[].id`).
- `API-xx` (API Contract): API contract in `spec/spec.json` (`contracts.apis[].id`).
- `OP-xx` (Operation): internal operation in `spec/spec.json` (`operations[].id`), linked to one or more `AC-xx`.
- `DF-xx` (Data Flow): data flow in `spec/spec.json` (`dataFlows[].id`), linked to a `UC-xx`.

Notes on test types inside AC:
- `acceptanceCriteria[].tests`: automated tests (repo-root file path + `#AC-xx`), executed by `npm test`.
- `acceptanceCriteria[].manualTests`: manual tests tracked in the spec with `status: pending|pass|fail`.
- `acceptanceCriteria[].externalTests`: tests run in external environments (e.g., staging) tracked in the spec with `status: pending|pass|fail`.

### File-by-file tour

```
specflow/
├─ AGENTS.md                # operating guide (roles, workflow, CI)
├─ README.md                # this document
├─ package.json             # npm scripts and dependencies for the boilerplate
├─ vitest.config.ts         # Vitest config to run repo-level example tests
├─ .codex/                  # local skills and templates used by Codex CLI
│  ├─ skills/
│  │  ├─ specflow-architect/
│  │  │  ├─ SKILL.md        # instructions for the architect role
│  │  │  ├─ assets/
│  │  │  │  ├─ templates/  # baseline files copied by `specflow:init`
│  │  │  │  └─ examples/   # reference snippets
│  │  │  └─ README.md
│  │  └─ specflow-developer/
│  │     ├─ SKILL.md       # instructions for the developer role
│  │     └─ assets/examples
├─ inputs/
│  ├─ requirements.json     # functional requirements (source of truth)
│  ├─ requirements.md       # generated view – do not edit
│  ├─ constraints.json      # business/technical constraints (source of truth)
│  ├─ constraints.md        # generated view – do not edit
│  ├─ stack.json            # declared tech stack (source of truth)
│  ├─ stack.md              # generated view – do not edit
│  └─ db.mmd                # Mermaid ER diagram (DB contract)
├─ spec/
│  ├─ spec.json             # UC, AC, contracts, data flows and DB (source of truth)
│  └─ spec.md               # generated spec view
├─ tasks/
│  ├─ tasks.json            # T-xx tasks linked to AC
│  └─ tasks.md              # generated view
├─ decisions/
│  ├─ decisions.json        # decision log (status, reasons, consequences)
│  └─ decisions.md          # generated view
├─ scripts/
│  ├─ specflow-init.js      # copies templates when input files are missing
│  ├─ chain-check.js        # validates UC → AC → Task/tests chain
│  ├─ tests-map.js          # prints AC → tests map (file presence/status)
│  ├─ dev-guard.js          # blocks forbidden changes depending on the role
│  ├─ dev-branch.js         # creates a `dev/*` branch from a `T-xx`
│  ├─ generate-md.js        # regenerates all Markdown views
│  └─ utils/
│     ├─ fs.js              # helper file I/O
│     ├─ format.js          # Markdown formatting helpers
│     └─ ids.js             # id validators (UC/AC/T)
├─ schemas/                 # JSON Schemas for input/reference
│  ├─ requirements.schema.json
│  ├─ constraints.schema.json
│  ├─ stack.schema.json
│  ├─ spec.schema.json
│  ├─ tasks.schema.json
│  └─ decisions.schema.json
```

Example application code (outside Specflow):

```
repo-root/
├─ specflow/                # this boilerplate (spec + tooling)
└─ app/                     # example application code (not part of Specflow)
  ├─ src/..
  └─ tests/..               # example automated tests (not part of Specflow)
```

## Prerequisites

- Node.js 20+
- npm
- Codex CLI configured to run the `$specflow-architect` or `$specflow-developer` skills (see `.codex/skills` and `~/.codex/prompts`).

Install dependencies once network access is available:

```bash
npm install
```

## Script catalog

| Script | Purpose | When to run |
| --- | --- | --- |
| `npm run specflow:init` | Copies the latest templates from `.codex/skills/specflow-architect/assets/templates` into the repo, skipping files that already exist. | First-time setup of a repo or when onboarding a new Specflow project. Architect-only. |
| `npm run spec:md` | Converts every JSON source (`inputs/`, `spec/`, `tasks/`, `decisions/`) into the corresponding Markdown view. Uses `scripts/generate-md.js`. | After any JSON change in architect mode. Also part of CI to ensure `.md` matches the JSON. |
| `npm run chain:check` | Runs `scripts/chain-check.js` and `scripts/tests-map.js` to validate UC → AC → Task links, verify that each AC has coverage (automated/manual/external), and print the AC→test matrix. | Before every commit and inside CI. Both architect and developer should run it to ensure references are intact. |
| `npm run dev:guard -- --mode=architect` | Ensures there are no staged/working changes in `src/` or `tests/`. Fails otherwise. | Architect mode. Use it before committing or as part of CI on `arch/*` branches. |
| `npm run dev:guard -- --mode=developer` | Blocks modifications to `specflow/inputs/**`, `specflow/spec/**`, `specflow/tasks/**`, `specflow/decisions/**`, and `specflow/inputs/db.mmd`. | Developer mode. Run before committing or during CI on `dev/*` branches. |
| `npm run dev:branch -- --task=T-xx` | Creates a `dev/*` git branch for a task in `tasks/tasks.json` (optionally checks it out). | At the start of developer work for a specific `T-xx`. |
| `npm run run:task` | Shortcut for the developer loop: `npm run chain:check && npm run dev:guard -- --mode=developer && npm test`. | Developer mode when implementing a `T-xx`. |
| `npm test` | Executes automated tests via Vitest (configured by `vitest.config.ts` to include repo-level example tests). Manual/external tests are not executed by the runner; their status is tracked inside `spec/spec.json`. | Any time automated tests need to run (developer workflow, CI). |

### Script internals

- `scripts/specflow-init.js` reads template files from `.codex/skills/specflow-architect/assets/templates` and writes them into the repo if they are missing. It never overwrites existing files.
- `scripts/generate-md.js` loads JSON via `scripts/utils/fs.js`, formats sections with helpers from `scripts/utils/format.js`, and writes Markdown views into `inputs/*.md`, `spec/spec.md`, `tasks/tasks.md`, and `decisions/decisions.md`.
- `scripts/chain-check.js` enforces the integrity chain:
  - Specs must declare at least one UC.
  - Every AC references a valid UC and has at least one test entry of any type: automated, manual, or external.
  - Each test reference points to an existing file that contains the `AC-xx` tag.
  - Every task references existing AC ids.
- `scripts/tests-map.js` prints an AC→tests summary including automated file presence and manual/external status.
- `scripts/dev-guard.js` inspects `git status --porcelain` and aborts if forbidden paths were modified for the chosen mode.
- `scripts/dev-branch.js` reads `tasks/tasks.json` and creates a `dev/T-xx-<slug>` branch from the current HEAD (and checks it out by default).

## Test types in `spec/spec.json`

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
  "tests": ["frontend/tests/checkout.test.ts#AC-10"],
  "manualTests": [{ "name": "QA checklist checkout", "status": "pending" }],
  "externalTests": [{ "name": "Staging smoke", "environment": "staging", "status": "pass" }]
}
```

Notes:
- `npm test` only runs `tests` (automated).
- `npm run chain:check` validates that every AC has at least one test entry (any type) and that automated test files exist.

## Working modes

### Architect

1. Work on an `arch/*` branch.
2. Update `inputs/*.json`, `inputs/db.mmd`, `spec/spec.json`, `tasks/tasks.json`, and `decisions/decisions.json`.
3. Run `npm run spec:md` to refresh all views.
4. Execute `npm run chain:check`.
5. Run `npm run dev:guard -- --mode=architect` before committing.

### Developer

1. Work on a `dev/T-xx-*` branch.
2. Read `spec/spec.md` and `decisions/decisions.md` to understand the AC you need to implement.
3. Modify only `src/` and `tests/`.
4. Use `npm run run:task` (or the component scripts) until tests pass.
5. Keep the `AC-xx` markers in your tests so `chain:check` succeeds.

## CI recommendations

The repo-level workflow `../.github/workflows/ci.yml` performs the following steps:

1. `npm install`
2. `npm run chain:check`
3. `npm run dev:guard -- --mode=architect|developer` (mode derived from branch name)
4. `npm run spec:md` and `git diff --exit-code`
5. `npm test`

This mirrors the expected local workflow and guarantees that JSON and Markdown never diverge.

## Git (mini cheat sheet)

Minimal path to work with branches + PRs (no Git expertise required).

### 6 core commands

From the repo root (not inside `specflow/`):

- See your current branch and what changed: `git status`
- Create and switch to a new branch: `git checkout -b arch/UC-02-checkout` or `git checkout -b dev/T-05-implement-AC-10`
- (Alternative for dev tasks) Create a branch from a task: `cd specflow && npm run dev:branch -- --task=T-05`
- Inspect changes (optional): `git diff`
- Stage files for commit: `git add specflow` (or `git add <file>` to be more selective)
- Create a commit: `git commit -m "UC-02: define checkout flow"` or `git commit -m "T-05: implement AC-10"`
- Push to GitHub: `git push -u origin <branch-name>`

### What is a Pull Request (PR)?

A PR is a request on GitHub to merge your branch into the main branch (`main`/`master`). It is used to:
- run CI automatically
- review changes
- keep discussion/history in one place

### Typical Specflow flow

- **Architect** (spec): uses `arch/*`, edits JSON + regenerates `.md` views, then opens a PR.
- **Developer** (code/tests): uses `dev/*`, edits only code/tests, then opens a PR.

### Automatic dev branch creation

From inside `specflow/`:

```bash
npm run dev:branch -- --task=T-01
```

Behavior:
- creates `dev/T-01-<task-title-slug>` (if missing)
- checks out the branch (default)
- prints a short summary (task id, AC, suggested files)

Options:
- `--checkout=false` to create the branch without checking it out

### How to open a PR (practical)

1. Push your branch with `git push`.
2. Go to GitHub → repository → you should see “Compare & pull request” (or go to “Pull requests” → “New pull request”).
3. Select base = `main/master`, compare = your branch (`arch/...` or `dev/...`).
4. Create the PR and wait for the pipeline to be green before merging.

## Skills & prompts

- `.codex/skills/specflow-architect` and `.codex/skills/specflow-developer` document the responsibilities for each role and ship the templates/examples used by the automation scripts.
- `~/.codex/prompts/architect.md` and `~/.codex/prompts/developer.md` are slash prompts that invoke the corresponding skill for deterministic CLI workflows.

Refer to these files whenever you need to understand the scope of a role or to regenerate the base assets.
