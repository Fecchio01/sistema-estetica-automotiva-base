# WhatsApp Conversation Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a manual WhatsApp conversation inbox inside Atelier OS, backed by an isolated Evolution API instance and Supabase data.

**Architecture:** Evolution sends message, chat, connection and QR events to a Supabase Edge Function. The function validates the instance, normalizes idempotent records into tenant-scoped conversation/message/media tables, and lets Supabase Realtime update the inbox. Server-side routes keep the Evolution API key private and perform status, QR, text and media operations; the browser only uses authenticated application routes.

**Tech Stack:** Plain browser JavaScript and CSS, Node.js HTTP server, Supabase PostgreSQL/RLS/Realtime/Storage, Supabase Edge Functions, Evolution API webhooks and REST endpoints.

**Spec:** `docs/superpowers/specs/2026-08-19-whatsapp-inbox-design.md`

## Global Constraints

- No automatic replies, chatbot, keyword rules or AI responses.
- Never expose `EVOLUTION_API_KEY` to browser code, logs or JSON responses.
- Every WhatsApp record must carry `company_id`; RLS must prevent cross-company access.
- Only administrator and reception can use the inbox in this phase.
- Incoming webhook processing must be idempotent by the Evolution remote message id.
- Media must be limited by type and size and accessed only through a tenant-checked route/storage policy.
- Run the repository test suite and 15 end-to-end scenarios before declaring completion.

---

### Task 1: Define and test Evolution event normalization

**Files:**
- Create: `src/whatsapp-inbox.js`
- Create: `tests/whatsapp-inbox.test.mjs`
- Modify: `src/evolution-api.js`

**Interfaces:**
- Produces `normalizeRemoteJid(value) -> string`.
- Produces `normalizeEvolutionEvent(payload, instance) -> { kind, remoteId, remoteJid, direction, text, media, sentAt, status }`.
- Produces `buildEvolutionWebhookConfig(baseUrl, instance, webhookUrl, apiKey) -> { path, headers, body }`.
- Produces `buildManualMessage(number, text, media) -> { number, text?, media? }`.

- [ ] **Step 1: Write failing tests** for text received, text sent, duplicate remote ids, image metadata, missing text, malformed payload, and JID normalization.
- [ ] **Step 2: Run only the new test file** with `node --test tests/whatsapp-inbox.test.mjs`; confirm it fails because the normalization functions do not exist.
- [ ] **Step 3: Implement the pure normalization functions** without network access or database writes. Accept both `messages.upsert` and `MESSAGES_UPSERT` event spellings.
- [ ] **Step 4: Add Evolution webhook configuration and media-send payload builders** while keeping the API key only in request headers.
- [ ] **Step 5: Run the focused tests and then `npm.cmd test`**; all existing and new tests must pass.
- [ ] **Step 6: Commit** with `git add src/whatsapp-inbox.js src/evolution-api.js tests/whatsapp-inbox.test.mjs` and `git commit -m "feat: normalize WhatsApp inbox events"`.

### Task 2: Add tenant-scoped conversation, message and media storage

**Files:**
- Create: `supabase/migrations/20260819_whatsapp_inbox.sql`
- Create: `tests/whatsapp-inbox-schema.test.mjs`

**Interfaces:**
- Tables: `public.whatsapp_conversations`, `public.whatsapp_messages`, `public.whatsapp_media`.
- Unique keys: `(company_id, remote_jid)` for conversations and `(company_id, remote_message_id)` for messages.
- Storage bucket: private `whatsapp-media`.

- [ ] **Step 1: Write schema expectation tests** checking the migration text contains tenant columns, unique constraints, foreign keys, indexes, RLS enablement, private bucket creation and policies for administrator/reception.
- [ ] **Step 2: Run the focused schema tests** and confirm they fail because the migration does not exist.
- [ ] **Step 3: Write the migration** with `company_id` foreign keys, conversation/message/media columns, indexes on company and activity time, and `on delete cascade` only from conversation to its dependent rows.
- [ ] **Step 4: Add RLS policies** using the existing private company and role helpers; permit administrator/reception in the same company and deny employee access.
- [ ] **Step 5: Add private Storage policies** requiring the first path segment to equal the caller’s company id and a staff role.
- [ ] **Step 6: Run the focused tests, apply the SQL through the Supabase SQL connector, then verify** table definitions, RLS, policy names and bucket visibility with read-only queries. Run Supabase advisors and record any non-blocking existing warnings.
- [ ] **Step 7: Commit** with `git add supabase/migrations/20260819_whatsapp_inbox.sql tests/whatsapp-inbox-schema.test.mjs` and `git commit -m "feat: add tenant-scoped WhatsApp inbox storage"`.

### Task 3: Implement the authenticated Evolution webhook

**Files:**
- Create: `supabase/functions/evolution-webhook/index.ts`
- Create: `supabase/functions/evolution-webhook/README.md`
- Create: `tests/evolution-webhook.test.mjs`

**Interfaces:**
- `POST /functions/v1/evolution-webhook` accepts Evolution events.
- The function resolves an instance to one company using server-side configuration and never trusts a client-supplied `company_id`.
- Duplicate messages return `200` with `{ ok: true, duplicate: true }`.

- [ ] **Step 1: Write failing tests** for accepted message events, rejected unknown instances, duplicate remote ids, connection updates, media metadata, and invalid webhook authentication.
- [ ] **Step 2: Run the focused tests** and confirm failure because the function and handler are missing.
- [ ] **Step 3: Implement request validation**: allow only POST, enforce a configured webhook secret/signature, reject unknown instance names, and cap the JSON body size.
- [ ] **Step 4: Implement idempotent upsert logic**: upsert conversation by company/JID, insert message by company/remote id, update unread count only for inbound messages, and store media metadata without logging message content.
- [ ] **Step 5: Implement connection and QR event handling** in a small status table or existing settings path, using only the company resolved from the instance.
- [ ] **Step 6: Run tests with a local Supabase-compatible harness or dependency injection** and verify that malformed events produce 4xx while valid replays remain safe.
- [ ] **Step 7: Commit** with `git add supabase/functions/evolution-webhook tests/evolution-webhook.test.mjs` and `git commit -m "feat: receive Evolution WhatsApp webhooks"`.

### Task 4: Add private server routes for connection and manual sending

**Files:**
- Modify: `dev-server.mjs`
- Modify: `src/evolution-api.js`
- Create: `tests/whatsapp-server-routes.test.mjs`
- Modify: `.env.example`

**Interfaces:**
- `GET /api/whatsapp/connection` returns `{ configured, state, instance }` without returning the API key.
- `GET /api/whatsapp/qr` returns a short-lived QR payload or a safe error.
- `POST /api/whatsapp/messages` accepts `{ conversationId, text, media }` and sends only after server-side tenant/role validation.
- `POST /api/whatsapp/webhook-config` configures the webhook using server-side credentials.

- [ ] **Step 1: Write failing route tests** asserting no key leakage, validation of empty text, accepted image MIME types, rejection of oversized media and correct Evolution paths.
- [ ] **Step 2: Run the focused tests** and confirm failure because the routes are not present.
- [ ] **Step 3: Implement request helpers** for connection state, QR retrieval, text send and media send using `apikey` headers only.
- [ ] **Step 4: Implement server routes** with consistent JSON errors, request-size limits, and no browser exposure of environment variables.
- [ ] **Step 5: Add `.env.example` variables** for `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `EVOLUTION_WEBHOOK_URL` and `EVOLUTION_WEBHOOK_SECRET`, with fake values only.
- [ ] **Step 6: Run focused route tests and `npm.cmd test`**; inspect output for leaked secrets.
- [ ] **Step 7: Commit** with `git add dev-server.mjs src/evolution-api.js .env.example tests/whatsapp-server-routes.test.mjs` and `git commit -m "feat: add private WhatsApp connection routes"`.

### Task 5: Build the conversations panel and realtime client

**Files:**
- Create: `src/whatsapp-inbox-ui.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/whatsapp-inbox-ui.test.mjs`

**Interfaces:**
- `renderWhatsAppInbox(state) -> HTMLElement|string` renders list, conversation, composer, media preview and connection state.
- `formatWhatsAppMessage(message) -> string` escapes text and formats time safely.
- `canUseWhatsAppInbox(profile) -> boolean` returns true only for administrator/reception.

- [ ] **Step 1: Write failing UI logic tests** for role visibility, empty state, unread ordering, escaped message text, image preview, disconnected state and send-button validation.
- [ ] **Step 2: Run the focused UI tests** and confirm failure because the UI module does not exist.
- [ ] **Step 3: Implement pure rendering and permission helpers** with no direct `innerHTML` insertion of untrusted message text; use text nodes or an escaping helper.
- [ ] **Step 4: Add the inbox route to `app.js`** and hide it from employee/client navigation.
- [ ] **Step 5: Add Supabase Realtime subscriptions** filtered by the current company and active conversation; unsubscribe on navigation.
- [ ] **Step 6: Connect QR/status, manual text send, media upload and mark-as-read actions** to the private server routes.
- [ ] **Step 7: Update responsive styles** for desktop two-column inbox and a stacked mobile layout without changing the existing sidebar behavior.
- [ ] **Step 8: Run focused UI tests and the full test suite**; manually verify loading, empty, connected, error and media states.
- [ ] **Step 9: Commit** with `git add src/whatsapp-inbox-ui.js app.js index.html styles.css tests/whatsapp-inbox-ui.test.mjs` and `git commit -m "feat: add manual WhatsApp conversation inbox"`.

### Task 6: End-to-end validation and operational documentation

**Files:**
- Create: `tests/whatsapp-e2e-checklist.md`
- Modify: `docs/superpowers/specs/2026-08-19-whatsapp-inbox-design.md`
- Create: `docs/whatsapp-evolution-setup.md`

- [ ] **Step 1: Document the setup**: create Evolution instance, configure webhook URL/secret, scan QR from WhatsApp linked devices, verify connection and keep the API key in local/server secrets only.
- [ ] **Step 2: Run the 15 end-to-end scenarios**: connect, reconnect, receive text, receive image, receive document metadata, receive duplicate, receive unknown instance, show unread, mark read, send text, send image, simulate Evolution outage, verify role restriction, verify company isolation, and verify refresh/realtime consistency.
- [ ] **Step 3: Query Supabase after the run** to verify row counts, RLS policies, private media bucket and no cross-company records.
- [ ] **Step 4: Run `npm.cmd test` and record the result** in the checklist with zero failures.
- [ ] **Step 5: Commit** with `git add tests/whatsapp-e2e-checklist.md docs/whatsapp-evolution-setup.md docs/superpowers/specs/2026-08-19-whatsapp-inbox-design.md` and `git commit -m "docs: document WhatsApp inbox verification"`.

## Plan Self-Review

- Spec coverage: connection/QR, conversations, messages, media, manual send, realtime, tenant isolation, security, errors and 15 end-to-end scenarios are covered by Tasks 2–6.
- Placeholder scan: no `TBD`, `TODO` or unspecified implementation step is used.
- Type consistency: the normalized event object from Task 1 is the input contract for Task 3; the server route names in Task 4 match the UI actions in Task 5.
