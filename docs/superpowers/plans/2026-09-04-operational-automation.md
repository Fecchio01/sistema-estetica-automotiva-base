# Operational Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe internal operational alerts, workload suggestions, and configurable checklist enforcement without sending external messages or mutating records automatically.

**Architecture:** A pure automation-rules module derives alerts and suggestions from the current in-memory live snapshot. Existing loaders and UI components consume that result; only explicit UI actions continue to write to Supabase.

**Tech Stack:** Vanilla ES modules, Supabase client, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-04-operational-automation-design.md`

## Global Constraints

- Do not call Evolution/WhatsApp from this feature.
- Do not create automatic database writes while calculating alerts.
- Preserve current company isolation and existing manual workflows.
- Run `npm test` and `npm run test:e2e` before the single final commit.

---

### Task 1: Pure operational automation rules

**Files:**
- Create: `src/operational-automation.js`
- Create: `tests/operational-automation.test.mjs`

**Interfaces:**
- Produces: `buildOperationalAutomationModel(input, now)` returning `{ alerts, suggestedResponsibleId }`.
- Consumes: normalized service rows, profiles, photo records, and post-sale follow-ups.

- [ ] **Step 1: Write failing tests** for alert categories, date boundaries, malformed input, and least-loaded employee selection.
- [ ] **Step 2: Run** `node --test tests/operational-automation.test.mjs` and verify the new tests fail because the module is missing.
- [ ] **Step 3: Implement** pure calculation helpers and `buildOperationalAutomationModel` without network/database imports.
- [ ] **Step 4: Run** `node --test tests/operational-automation.test.mjs` and verify all new tests pass.

### Task 2: Dashboard alert integration

**Files:**
- Modify: `src/dashboard-organization.js`
- Modify: `tests/dashboard-organization.test.mjs`

**Interfaces:**
- Consumes: `automation` result from `buildOperationalAutomationModel`.
- Produces: operational-alert markup while preserving existing attention blocks.

- [ ] **Step 1: Write a failing dashboard test** proving the dashboard renders an understandable, grouped automation alert and remains empty-safe.
- [ ] **Step 2: Run** `node --test tests/dashboard-organization.test.mjs` and verify it fails for the missing markup.
- [ ] **Step 3: Implement** a compact alert block and merge it into the existing attention panel without removing current cards.
- [ ] **Step 4: Run** `node --test tests/dashboard-organization.test.mjs` and verify it passes.

### Task 3: Live snapshot integration and safe suggestions

**Files:**
- Modify: `src/live-data.js`
- Modify: `src/realtime-ui.js` or the existing service-form module only if it already owns responsible selection
- Modify: `tests/attendance-ui-refresh.test.mjs` or create focused test coverage

**Interfaces:**
- Consumes: current service snapshot and profiles.
- Produces: `globalThis.__operationalAutomation` and an optional suggested responsible field; never persists a suggestion until the form is submitted.

- [ ] **Step 1: Write a failing focused test** showing an empty responsible selection can receive a recommendation without changing an existing selected person.
- [ ] **Step 2: Run the focused test** and verify it fails for the absent integration.
- [ ] **Step 3: Implement** live model calculation and form preselection only when no explicit responsible is selected.
- [ ] **Step 4: Run the focused test** and verify it passes.

### Task 4: Checklist delivery guard

**Files:**
- Modify: `src/photo-checklist.js`
- Modify: `src/live-data.js` and the delivery-confirmation caller
- Modify: `tests/photo-checklist.test.mjs`
- Modify: `tests/work-order-state.test.mjs`

**Interfaces:**
- Produces: `missingChecklistStages(photos)` and delivery validation result.
- Consumes: five-stage photo data and the existing `requireFinalPhotos` preference.

- [ ] **Step 1: Write failing tests** proving missing photos block delivery only when the preference is enabled and complete checklists remain allowed.
- [ ] **Step 2: Run the focused tests** and verify they fail because the guard is absent.
- [ ] **Step 3: Implement** pure checklist validation, then call it immediately before the existing explicit delivery mutation.
- [ ] **Step 4: Run the focused tests** and verify they pass.

### Task 5: Full verification and single commit

**Files:**
- Modify: plan checkbox state only if needed.

- [ ] **Step 1: Run** `npm test` and inspect the entire result.
- [ ] **Step 2: Run** `npm run test:e2e` and inspect that all 15 named E2E tests pass.
- [ ] **Step 3: Inspect** `git diff --check` and `git status --short` for unintended files.
- [ ] **Step 4: Commit and push once** with `feat: add safe operational automation` only after verification succeeds.
