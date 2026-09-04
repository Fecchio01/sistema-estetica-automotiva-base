# Operational Automation Design

## Goal

Add safe, internal operational automation without sending external messages, changing an order stage, deleting records, or changing existing payment data automatically.

## Scope

The automation layer evaluates existing live work-order, employee, photo-checklist, agenda, quote, and post-sale data. It returns structured alerts and suggestions for the dashboard and form flows.

It must identify: appointments due soon, appointments without an assigned owner, operationally stale orders, ready-for-pickup orders waiting too long, incomplete mandatory photo checklists, overdue post-sale contacts, quotes requiring a follow-up, and a recommended least-loaded active employee.

## Safety Rules

- WhatsApp/Evolution remains disabled and is not invoked by this change.
- No automatic database writes occur from evaluating alerts or suggestions.
- Advancing an order stage, confirming delivery, sending a message, booking, assigning a person, and approving a quote remain explicit user actions.
- The existing `requireFinalPhotos` preference is enforced only at delivery confirmation; it does not delete or edit photos.
- Tenant/company isolation remains in existing data loaders and mutation queries.

## Architecture

`src/operational-automation.js` is a pure rules module. It consumes normalized live services, team profiles, photos, post-sale follow-ups, agenda items, and quote metadata, and produces `alerts` and an optional `suggestedResponsibleId`.

`src/dashboard-organization.js` renders grouped operational alerts from that model without altering current dashboard sources. `src/live-data.js` continues loading data and provides the additional model inputs. Existing UI actions opt in to the rules only where safe: the service form can preselect a recommendation, while delivery confirmation is blocked only if the configured checklist requirement is not met.

## Data Flow

1. Supabase realtime reloads live company data as it already does.
2. The pure rules engine calculates the current alerts from that snapshot and current time.
3. The dashboard displays concise alerts with a link to the relevant area.
4. Existing screens remain the only place that performs a mutation after a user action.

## Alert Rules

- Appointment soon: scheduled in the next 24 hours and not completed/cancelled.
- Unassigned: active order has no responsible employee.
- Stale: active order has stayed open for at least three hours.
- Pickup waiting: ready-for-pickup order has been ready for at least 24 hours.
- Photo checklist: an active order lacks at least one of the five required checklist-stage photos.
- Post-sale: follow-up is pending and due now or overdue.
- Quote: pending/approved quote metadata older than three days is presented as a follow-up suggestion only when the source exposes a persisted quote timestamp.
- Workload: lowest number of current active orders wins; ties are resolved alphabetically by full name. Administrators/reception are excluded from automatic employee recommendation unless explicitly marked as operational in the existing profile data.

## Failure Handling

Invalid or missing dates are ignored rather than producing false alerts. Missing photo data counts as incomplete only when the order is active. Empty teams produce no recommendation. The dashboard remains renderable with an empty automation result.

## Testing

Tests first cover each alert rule, time boundaries, empty/malformed inputs, workload tie breaking, checklist delivery guard, and non-mutating behavior. The full existing unit suite and the maintained 15-test E2E suite run before the final single commit.
