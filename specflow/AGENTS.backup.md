# Goal

Establish a Spec-Driven Development workflow with Codex CLI using **Specflow** (dedicated skill) and a **JSON-structured spec** as the single source of truth.

# Principles

* Truth lives inside **.json** files.
* `.md` files are **generated views** from JSON.
* `.md` files are never edited by hand.
* Every acceptance criterion (**AC**) has at least one test.
* Every AC points to a use case (**UC**).
* Behavioral changes: update spec first, then tests, then code.

# ID Glossary

* **UC-xx**: Use Case describing a user flow.
* **AC-xx**: Acceptance Criterion, a verifiable rule (given/when/then).
* **T-xx**: Atomic task linked to one or more ACs.
* **RQ-xx**: Business/User requirement (optional, if needed).

# Repository layout

## Manual inputs (sources of truth)

* `inputs/REQUISITI.json`
  Functional and non-functional requirements plus use cases in a structured form.
* `inputs/VINCOLI.json`
  Legal, security, budget, and integration constraints.
* `inputs/STACK.json`
  Runtime, framework, DB, tooling, versions.
* `inputs/DB.mmd`
  Database schema as a Mermaid ER diagram. Structural DB contract.

Generated views:

* `inputs/REQUISITI.md`
* `inputs/VINCOLI.md`
* `inputs/STACK.md`

## Machine sources of truth

* `spec/SPEC.json`
  UC, AC, contracts, data flow, DB.
* `tasks/TASKS.json`
  Tasks tied to ACs.
* `decisions/DECISIONS.json`
  Versioned design decisions.

## Generated views (per commit)

* `inputs/REQUISITI.md` (from `inputs/REQUISITI.json`)
* `inputs/VINCOLI.md` (from `inputs/VINCOLI.json`)
* `inputs/STACK.md` (from `inputs/STACK.json`)
* `SPEC.md` (from `spec/SPEC.json`)
* `TASKS.md` (from `tasks/TASKS.json`)
* `DECISIONS.md` (from `decisions/DECISIONS.json`)

Rule: never edit `.md` manually.

## Tests & code

* `src/` implementation
* `tests/` test suite

# Suggested SPEC.json structure

```json
{
  "meta": { "name": "project-name", "version": "0.1.0" },
  "scope": {
    "in": ["..."],
    "out": ["..."]
  },
  "techStack": {
    "runtime": "node",
    "framework": "...",
    "db": "...",
    "migrations": "...",
    "testRunner": "vitest|jest"
  },
  "useCases": [
    {
      "id": "UC-01",
      "title": "...",
      "actor": "...",
      "preconditions": ["..."],
      "mainFlow": ["1...", "2..."],
      "alternativeFlows": ["..."],
      "postconditions": ["..."],
      "errors": ["..."]
    }
  ],
  "acceptanceCriteria": [
    {
      "id": "AC-01",
      "useCase": "UC-01",
      "given": "...",
      "when": "...",
      "then": "...",
      "tests": ["tests/path.test.ts#AC-01"]
    }
  ],
  "contracts": {
    "apis": [
      {
        "id": "API-01",
        "method": "POST",
        "path": "/...",
        "request": { "schema": "..." },
        "response": { "schema": "..." },
        "errors": [{ "status": 400, "code": "..." }]
      }
    ]
  },
  "services": [
    {
      "name": "AuthService",
      "responsibilities": ["reset password", "token validation"]
    }
  ],
  "operations": [
    {
      "id": "OP-01",
      "service": "AuthService",
      "name": "requestPasswordReset",
      "input": { "schema": "..." },
      "output": { "schema": "..." },
      "errors": [{ "code": "RATE_LIMIT", "status": 429 }],
      "sideEffects": ["db.insert(reset_tokens)", "send_email"],
      "acceptanceCriteria": ["AC-01", "AC-02"]
    }
  ],
  "dataFlows": [
    {
      "id": "DF-01",
      "useCase": "UC-01",
      "steps": ["input -> service", "service -> db", "db -> response"],
      "diagramMermaid": "flowchart TD\n  A-->B"
    }
  ],
  "db": {
    "tables": [
      {
        "name": "...",
        "purpose": "...",
        "columns": [
          { "name": "id", "type": "uuid", "nullable": false }
        ],
        "indexes": ["..."],
        "constraints": ["..."],
        "relations": ["..."]
      }
    ]
  }
}
```

# Tasks & decisions

## TASKS.json

* Each task points to one or more ACs.
* Tasks must stay small in scope.

```json
{
  "tasks": [
    {
      "id": "T-01",
      "title": "Implement AC-01 expired reset token",
      "acceptanceCriteria": ["AC-01"],
      "files": ["tests/reset.int.test.ts", "src/reset.ts"],
      "doneWhen": ["tests pass", "AC-01 satisfied"]
    }
  ]
}
```

## DECISIONS.json

* Only document choices that could have gone differently.
* Never delete them—mark as superseded.

```json
{
  "decisions": [
    {
      "id": "D-01",
      "date": "2026-01-13",
      "status": "active",
      "title": "Reset token random 32 bytes",
      "reason": "easy revocation",
      "consequences": ["tokens table"]
    }
  ]
}
```

# Suggested Node scripts (AI + scripts)

## 1) chain-check

Validates the chain:

* UC exist
* every AC points to a valid UC
* every task points to a valid AC
* every AC has at least one test
* referenced test files exist
* optional: test file contains `AC-xx`

## 2) dev-guard

Blocks forbidden changes based on the mode.

* Architect mode:

  * `src/` and `tests/` are off-limits
* Developer mode:

  * forbidden to change `inputs/*.json`, `spec/SPEC.json`, `decisions/DECISIONS.json`, `inputs/DB.mmd`

## 3) tests-map

Ensures tests referenced inside ACs exist and are coherent.

## 4) generate-md

Regenerates every `.md` view from JSON.

# Suggested npm scripts

* `specflow:init` → `node scripts/specflow-init.js`
* `chain:check` → `node scripts/chain-check.js && node scripts/tests-map.js`
* `dev:guard` → `node scripts/dev-guard.js --mode=developer|architect`
* `spec:md` → `node scripts/generate-md.js`
* `test` → test runner (vitest/jest)
* `run:task` → `npm run chain:check && npm run dev:guard && npm test`

# Codex Skill behavior

## Context7 (library docs lookup)

Use Context7 only to consult library documentation.
It cannot alter the truth (JSON) while in developer mode.

* Architect mode:

  * use Context7 when editing `inputs/STACK.json`
  * use Context7 when creating/updating `spec/SPEC.json` if API/config details are needed

* Developer mode:

  * when a failing test involves a library, use Context7 to fix the API usage
  * do not change `spec/SPEC.json` or `DECISIONS.json`

## Combo mode (skill + slash)

* Repo skills:

  * `$specflow-architect`
  * `$specflow-developer`
* Local slash prompts:

  * `/prompts:architect`
  * `/prompts:developer`

Slash prompts invoke the skills and pass the input to get deterministic commands.

## Roles

### Architect

* Reads `inputs/`
* Updates `spec/SPEC.json`
* Proposes decisions
* Updates `decisions/DECISIONS.json` only after approval
* Regenerates `.md` views
* Updates `TASKS.json`

Forbidden:

* No edits to `src/`
* No edits to `tests/`

### Developer

* Picks up `T-xx`
* Reads only `SPEC.json` and `DECISIONS.json`
* Adds/updates tests for the task's ACs
* Implements the minimal code

Forbidden:

* No edits to `inputs/`
* No edits to `SPEC.json`
* No edits to `DECISIONS.json`
* No changes to stack or DB schema

# Daily workflow

1. Update `inputs/*.json` and `inputs/DB.mmd` in architect mode.
2. Update `spec/SPEC.json` and `decisions/DECISIONS.json` (decisions after approval).
3. Update `tasks/TASKS.json`.
4. Run `npm run spec:md` to regenerate views.
5. Run `npm run chain:check`.
6. In developer mode: implement `T-xx` test-first.
7. Run `npm test`.

# Complete structure of the skill

## Folders and files (repo)

```text
.
├─ inputs/
│  ├─ REQUISITI.json
│  ├─ VINCOLI.json
│  ├─ STACK.json
│  ├─ DB.mmd
│  ├─ REQUISITI.md              (generated)
│  ├─ VINCOLI.md                (generated)
│  └─ STACK.md                  (generated)
├─ spec/
│  ├─ SPEC.json
│  └─ SPEC.md                   (generated)
├─ tasks/
│  ├─ TASKS.json
│  └─ TASKS.md                  (generated)
├─ decisions/
│  ├─ DECISIONS.json
│  └─ DECISIONS.md              (generated)
├─ scripts/
│  ├─ specflow-init.js
│  ├─ chain-check.js
│  ├─ tests-map.js
│  ├─ dev-guard.js
│  ├─ generate-md.js
│  └─ utils/
│     ├─ ids.js
│     ├─ fs.js
│     └─ format.js
├─ schemas/
│  ├─ requisiti.schema.json
│  ├─ vincoli.schema.json
│  ├─ stack.schema.json
│  ├─ spec.schema.json
│  ├─ tasks.schema.json
│  └─ decisions.schema.json
├─ tests/
│  └─ ...
├─ src/
│  └─ ...
├─ package.json
└─ .github/
   └─ workflows/
      └─ ci.yml
```

## Codex skills (repo-scoped)

Example structure:

```text
.codex/
├─ skills/
│  ├─ specflow-architect/
│  │  ├─ SKILL.md
│  │  ├─ assets/
│  │  │  ├─ templates/
│  │  │  │  ├─ REQUISITI.template.json
│  │  │  │  ├─ VINCOLI.template.json
│  │  │  │  ├─ STACK.template.json
│  │  │  │  ├─ SPEC.template.json
│  │  │  │  ├─ TASKS.template.json
│  │  │  │  └─ DECISIONS.template.json
│  │  │  └─ examples/
│  │  │     └─ ...
│  │  └─ README.md
│  └─ specflow-developer/
│     ├─ SKILL.md
│     ├─ assets/
│     │  └─ examples/
│     │     └─ ...
│     └─ README.md
```

## Local slash prompts (combo option)

```text
~/.codex/prompts/
├─ architect.md   (invokes $specflow-architect)
└─ developer.md   (invokes $specflow-developer)
```

# Git workflow

## Branch naming

* Architect (spec/input):

  * `arch/UC-01-reset-password`
  * `arch/spec-refine`
  * `arch/db-schema-update`

* Developer (implementation):

  * `dev/T-07-implement-AC-03`
  * `dev/bugfix-AC-12`

## Commit message

* `UC-xx: ...` for use-case/spec changes
* `AC-xx: ...` for specific acceptance criteria changes
* `T-xx: ...` for implementation tasks

Examples:

* `UC-01: add reset password use case and flows`
* `AC-03: define expired token behavior (400) + test plan`
* `T-07: add tests for AC-03 and implement minimal fix`

## Guard rules (local + CI)

### Architect

Allowed:

* `inputs/**`
* `spec/**`
* `tasks/**`
* `decisions/**`
* generated `.md` views

Forbidden:

* `src/**`
* `tests/**`

### Developer

Allowed:

* `src/**`
* `tests/**`

Forbidden:

* `inputs/**`
* `spec/SPEC.json`
* `decisions/**`
* `inputs/DB.mmd`

## CI integration

* Branch starts with `arch/` → `npm run dev:guard -- --mode=architect`
* Branch starts with `dev/` → `npm run dev:guard -- --mode=developer`

## Generated views rule

* On `arch/` branches: run `npm run spec:md` and commit the regenerated views.
* On `dev/` branches: views must stay untouched. CI fails if they change.

# CI (minimum)

Workflow:

* install
* `npm run chain:check`
* `npm run dev:guard` (mode derived from branch or CI input)
* `npm run spec:md` and ensure `git diff --exit-code`
* `npm test`

Rule: if `spec/SPEC.json` or `inputs/*.json` change, `.md` views must already be regenerated (clean git diff).
