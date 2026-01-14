# Specflow Seed

Specflow Seed is a reference implementation of the Spec-Driven Development workflow described in `AGENTS.md`. Everything revolves around JSON sources of truth and a deterministic toolchain that keeps the spec, tasks, decisions, and code in sync.

> All paths below are relative to the `specflow/` directory. Run every npm command from here.

## Project layout

```
inputs/        # manual sources of truth (requirements, constraints, stack, DB)
spec/          # machine-readable spec (UC, AC, flows, contracts)
tasks/         # granular tasks tied to AC ids
decisions/     # architectural decisions with status history
scripts/       # Specflow automation (init, guardrails, markdown generation, checks)
schemas/       # JSON Schemas for validation/reference
src/           # implementation (developer mode only)
tests/         # test suites, one test per AC
.codex/        # repo-scoped skills and templates
```

Generated Markdown views (`*.md`) mirror the JSON files and must never be edited manually.

## Glossary of IDs (sigle)

Queste sono le sigle/ID usate nei vari file JSON per collegare requisiti, casi d’uso, criteri di accettazione, task e contratti.

- `RQ-xx` (Requirement): requisito funzionale in `inputs/REQUISITI.json` (`functionalRequirements[].id`).
- `UC-xx` (Use Case): caso d’uso in `spec/SPEC.json` (`useCases[].id`).
- `AC-xx` (Acceptance Criteria): criterio verificabile in `spec/SPEC.json` (`acceptanceCriteria[].id`), collegato a un `UC-xx` e ad almeno un test.
- `T-xx` (Task): task atomico in `tasks/TASKS.json` (`tasks[].id`), collegato a uno o più `AC-xx`.
- `D-xx` (Decision): decisione progettuale in `decisions/DECISIONS.json` (`decisions[].id`).
- `V-xx` (Vincolo): vincolo in `inputs/VINCOLI.json` (`constraints[].id`).
- `API-xx` (API Contract): contratto API in `spec/SPEC.json` (`contracts.apis[].id`).
- `OP-xx` (Operation): operazione interna in `spec/SPEC.json` (`operations[].id`), collegata a uno o più `AC-xx`.
- `DF-xx` (Data Flow): flusso dati in `spec/SPEC.json` (`dataFlows[].id`), collegato a un `UC-xx`.

### File-by-file tour

```
specflow/
├─ AGENTS.md                # contratto operativo (ruoli, workflow, CI)
├─ README.md                # questo documento
├─ package.json             # scripts npm e dipendenze per il boilerplate
├─ .codex/                  # skill locali e template usati da Codex CLI
│  ├─ skills/
│  │  ├─ specflow-architect/
│  │  │  ├─ SKILL.md        # istruzioni per il ruolo architect
│  │  │  ├─ assets/
│  │  │  │  ├─ templates/  # file base copiati da `specflow:init`
│  │  │  │  └─ examples/   # snippet di riferimento
│  │  │  └─ README.md
│  │  └─ specflow-developer/
│  │     ├─ SKILL.md       # istruzioni per il ruolo developer
│  │     └─ assets/examples
├─ inputs/
│  ├─ REQUISITI.json        # requisiti funzionali (fonte di verità)
│  ├─ REQUISITI.md          # vista generata – non modificare
│  ├─ VINCOLI.json          # vincoli business/tecnici
│  ├─ VINCOLI.md            # vista generata
│  ├─ STACK.json            # stack tecnologico dichiarato via Context7
│  ├─ STACK.md              # vista generata
│  └─ DB.mmd                # schema ER in Mermaid
├─ spec/
│  ├─ SPEC.json             # UC, AC, contratti, data flow e DB (fonte di verità)
│  └─ SPEC.md               # vista generata della spec
├─ tasks/
│  ├─ TASKS.json            # task T-xx collegati agli AC
│  └─ TASKS.md              # vista generata
├─ decisions/
│  ├─ DECISIONS.json        # decision log (status, motivazioni, conseguenze)
│  └─ DECISIONS.md          # vista generata
├─ scripts/
│  ├─ specflow-init.js      # copia i template se mancano file di input
│  ├─ chain-check.js        # verifica la catena UC → AC → Task/test
│  ├─ tests-map.js          # stampa la mappa AC → test (presenza file)
│  ├─ dev-guard.js          # blocca modifiche non permesse a seconda del ruolo
│  ├─ generate-md.js        # rigenera tutte le viste Markdown
│  └─ utils/
│     ├─ fs.js              # helper file I/O
│     ├─ format.js          # helper di formattazione Markdown
│     └─ ids.js             # validatori di id (UC/AC/T)
├─ schemas/                 # JSON Schema di supporto per i file di input
│  ├─ requisiti.schema.json
│  ├─ vincoli.schema.json
│  ├─ stack.schema.json
│  ├─ spec.schema.json
│  ├─ tasks.schema.json
│  └─ decisions.schema.json
├─ src/
│  └─ todos/createTodo.js   # implementazione di esempio per AC-01/AC-02
└─ tests/
   └─ todos/create.todo.test.ts  # test Vitest che coprono gli AC di esempio
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
| `npm run chain:check` | Runs `scripts/chain-check.js` and `scripts/tests-map.js` to validate UC → AC → Task links, verify that each AC references real tests, and print the AC→test matrix. | Before every commit and inside CI. Both architect and developer should run it to ensure references are intact. |
| `npm run dev:guard -- --mode=architect` | Ensures there are no staged/working changes in `src/` or `tests/`. Fails otherwise. | Architect mode. Use it before committing or as part of CI on `arch/*` branches. |
| `npm run dev:guard -- --mode=developer` | Blocks modifications to `inputs/**`, `spec/**`, `tasks/**`, `decisions/**`, and `inputs/DB.mmd`. | Developer mode. Run before committing or during CI on `dev/*` branches. |
| `npm run run:task` | Shortcut for the developer loop: `npm run chain:check && npm run dev:guard -- --mode=developer && npm test`. | Developer mode when implementing a `T-xx`. |
| `npm test` | Executes the Vitest suite. Each AC listed in the spec must have at least one test tagged with its id. | Any time tests need to run (developer workflow, CI). |

### Script internals

- `scripts/specflow-init.js` reads template files from `.codex/skills/specflow-architect/assets/templates` and writes them into the repo if they are missing. It never overwrites existing files.
- `scripts/generate-md.js` loads JSON via `scripts/utils/fs.js`, formats sections with helpers from `scripts/utils/format.js`, and writes Markdown views into `inputs/*.md`, `spec/SPEC.md`, `tasks/TASKS.md`, and `decisions/DECISIONS.md`.
- `scripts/chain-check.js` enforces the integrity chain:
  - Specs must declare at least one UC.
  - Every AC references a valid UC and lists one or more tests.
  - Each test reference points to an existing file that contains the `AC-xx` tag.
  - Every task references existing AC ids.
- `scripts/tests-map.js` prints a summary of which tests implement each AC and whether their files exist.
- `scripts/dev-guard.js` inspects `git status --porcelain` and aborts if forbidden paths were modified for the chosen mode.

## Working modes

### Architect

1. Work on an `arch/*` branch.
2. Update `inputs/*.json`, `inputs/DB.mmd`, `spec/SPEC.json`, `tasks/TASKS.json`, and `decisions/DECISIONS.json`.
3. Run `npm run spec:md` to refresh all views.
4. Execute `npm run chain:check`.
5. Run `npm run dev:guard -- --mode=architect` before committing.

### Developer

1. Work on a `dev/T-xx-*` branch.
2. Read `spec/SPEC.md` and `decisions/DECISIONS.md` to understand the AC you need to implement.
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

## Skills & prompts

- `.codex/skills/specflow-architect` and `.codex/skills/specflow-developer` document the responsibilities for each role and ship the templates/examples used by the automation scripts.
- `~/.codex/prompts/architect.md` and `~/.codex/prompts/developer.md` are slash prompts that invoke the corresponding skill for deterministic CLI workflows.

Refer to these files whenever you need to understand the scope of a role or to regenerate the base assets.
