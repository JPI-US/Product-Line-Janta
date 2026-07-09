# Agent instructions

**Before any task**, read and follow [`docs/AGENT-PLAYBOOK.md`](docs/AGENT-PLAYBOOK.md) in full.

Cursor loads `.cursor/rules/agent-playbook.mdc` (`alwaysApply: true`) as a session reminder; the playbook is the source of truth.

## Definition of Done (every change)

```bash
npx tsc -b
npx vite build
npm run check:bundle    # wire in package.json if missing
npm run test:visual     # wire in package.json if missing
```

Visual changes: eyeball screenshots before updating baselines.

## Working method

Diagnose first (§12). Phase non-trivial work. Flag look-altering changes **ask first**.
