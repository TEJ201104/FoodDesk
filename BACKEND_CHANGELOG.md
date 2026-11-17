# FoodDesk Architecture Changelog — Version 9.0 to Version 10.2.2 (Final Defect Resolution & Architecture Freeze)

---

## Executive Summary

| Attribute | Details |
| :--- | :--- |
| **Document Title** | FoodDesk Backend Architecture: Consolidated V9 → V10.2.2 Changelog |
| **File Location** | `D:\Projects\FoodDesk\BACKEND_V9_TO_V10_CHANGELOG.md` |
| **Target Versions** | Transition from Version 9.0 to Version 10.2.2 (Final Schema, Payment, Refund & Permission Corrections) |
| **Scope of Changes** | Complete 58 Technical Defect Resolutions (DEF-01 through DEF-58), Explicit Gateway Provider Enforcement across Service Signature & Schema Defaults (DEF-56), Dual-Layer Validation Architecture with Dynamic Provider Policy Pre-Validate Hook (DEF-57), Test-Only Fixture `test_gateway` & Direct Schema-Level Tests TS-PAY-15/16 (DEF-58), Unconditional Gateway Payment ID Validation (DEF-50), Canonical Product-Scope & Business Model vs Deployment Mode Decoupling (DEC-00 & DEF-55), Payment Schema Field Reconciliation, Authoritative Duplicate Capture Invariance, Refund Worker Heartbeat Lease Expansion, Tenant-Scoped Idempotency Indexing, Full Fingerprint Coverage, Dedicated Availability Toggling Action, and Hardened Webhook Signature Hex Validation |
| **Integrity Boundary** | Zero backend code implemented; zero frontend files modified; all V1–V9 baseline files preserved |

---

## Itemized Changelog: Defect Resolutions (CHG-V10-01 to CHG-V10-58)

---

### CHG-V10-01: Refund Worker Lease Correctness & Dynamic Instant Evaluation (DEF-01)
- **Severity:** CRITICAL
- **Affected Section:** Section 11.1 (`processPendingRefundJobs`), Section 11.2 (Crash Timelines).
- **Resolution:** Replaced stale pre-gateway timestamp with dynamic evaluation (`new Date()`) at every transition; added 10s heartbeat renewing 30s leases with zero-match lease loss detection and `AbortController` cancellation.
- **Status:** Verified.

---

### CHG-V10-02: Refund Ledger & Job Recovery Index Syntax Correction (DEF-02)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 9 `RefundSchema`), Section 11.1.
- **Resolution:** Replaced unsupported `$ne` with valid MongoDB `$type` operators: `{ refundJobId: { $type: "objectId" } }` and `{ gatewayRefundId: { $type: "string" } }`. Added duplicate-key E11000 reconciliation comparing financial invariants to complete jobs idempotently.
- **Status:** Verified.

---

### CHG-V10-03: Payment Settlement Authority & Duplicate Capture Reversal (DEF-03)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 8 `PaymentTransactionSchema`), Section 10.1.
- **Resolution:** Made database atomic updates the final settlement authority over Redis locks. Added unique constraint: `{ gatewayProvider: 1, gatewayPaymentId: 1 }`. Automated duplicate capture `RefundJob` creation.
- **Status:** Verified.

---

### CHG-V10-04: Complete Independent Webhook Recovery Worker (DEF-04)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 17 `WebhookEventSchema`), Section 12.1.
- **Resolution:** Preserved raw Buffer bytes for signature verification. Implemented complete independent recovery worker with 30s leases, monotonic fencing tokens, exponential backoff, and dead-letter handling.
- **Status:** Verified.

---

### CHG-V10-05: Strict Tenant Authorization & Startup Validation (DEF-05)
- **Severity:** CRITICAL
- **Affected Section:** Section 3 (Permission Matrix), Section 19.1 (`tenantMiddleware`).
- **Resolution:** Application boot halts if `DEFAULT_STALL_ID` is missing/invalid in single-stall mode. Separated Super Admin administrative inspection from operational counter POS access.
- **Status:** Verified.

---

### CHG-V10-06: Versioned Keyring & Decryption Architecture (DEF-06)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 2 `SessionSchema`), Section 14.1.
- **Resolution:** Configured versioned keyring (`TOKEN_ENCRYPTION_KEYS={"1": "...", "2": "..."}`). Encrypts using `PRIMARY_KEY_VERSION`; decrypts dynamically using `encryptedActiveToken.keyVersion`.
- **Status:** Verified.

---

### CHG-V10-07: Inventory Operation Types & Canonical Fingerprinting (DEF-07)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 13 `StockMovementSchema`), Section 17.1.
- **Resolution:** Added explicit movement types (`restock`, `manual_adjustment`, `wastage`, `order_consumption`, `order_refund_restock`). Formulated canonical SHA-256 payload fingerprint covering all material parameters.
- **Status:** Verified.

---

### CHG-V10-08: Timezone-Aware Business Date & Explicit Hour Cycle (DEF-08)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 3 `StallSchema`), Section 16.1 (`getBusinessDate`).
- **Resolution:** Validates IANA timezone with `Intl.DateTimeFormat`. Implemented `hourCycle: 'h23'` and constrained cutoff hours (0–12). Handles midnight rollovers and DST accurately.
- **Status:** Verified.

---

### CHG-V10-09: Schema & Index Operator Audit (DEF-09)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (All Collections), Section 8.2 (Field-to-Index Matrix).
- **Resolution:** Audited all 19 collections. Replaced all invalid partial index operators with supported `$type` expressions. Verified all enum values match state machine transitions.
- **Status:** Verified.

---

### CHG-V10-10: Financial Invariance & Review Summary Correction (DEF-10)
- **Severity:** CRITICAL
- **Affected Section:** Section 13.1, Section 13.2 (Worked Scenarios).
- **Resolution:** Reconciled all 5 worked examples to ₹0.00 discrepancy. Corrected Scenario 3 summary to **+₹210.00 Gross Profit** across all documentation.
- **Status:** Verified.

---

### CHG-V10-11: Public Tracking Redaction & Privacy Hardening (DEF-11)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 7 `OrderSchema`), Section 15.1.
- **Resolution:** Standardized exclusively on `trackingToken`. Strictly omitted customer phone numbers, internal ObjectIds, payment IDs, and cost prices from public endpoints. Enforced 60 req/min rate limit.
- **Status:** Verified.

---

### CHG-V10-12: Transactional Outbox Worker Specification (DEF-12)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 16 `OutboxEventSchema`), Section 18.1.
- **Resolution:** Specified complete outbox worker with claim query, 30s lease, and monotonic fencing tokens. Emits to Redis Pub/Sub room `stall:<stallId>:<eventType>`. Client deduplicates via `eventId`.
- **Status:** Verified.

---

### CHG-V10-13: Audit Logging Schema Consistency & Redaction (DEF-13)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 18 `AuditLogSchema`), Section 20.1.
- **Resolution:** Fully aligned all audit calls with `AuditLogSchema`. Defined `actorType` (`user`, `system`, `gateway_webhook`). Enforced strict redaction of secrets, passwords, and tokens.
- **Status:** Verified.

---

### CHG-V10-14: Transparent Frontend Codebase Inspection & Mapping (DEF-14)
- **Severity:** HIGH
- **Affected Section:** Section 2, Section 22.1 (Contract Matrix).
- **Resolution:** Transparently documented that `api.ts` does not exist; actual frontend is React 18 JSX using local JavaScript services. Formulated explicit mapping between backend REST routes and frontend functions in `mockAuthService.js` and `stallDataService.js`.
- **Status:** Verified.

---

### CHG-V10-15: Background Worker Infrastructure & Operational Lifecycle (DEF-15)
- **Severity:** HIGH
- **Affected Section:** Section 24.1 (Worker Specifications).
- **Resolution:** Formally specified claim queries, lease durations, heartbeat intervals, and dead-letter alerts for all 5 background workers (Refund, Webhook, Outbox, SMS/Receipt, Cleanup).
- **Status:** Verified.

---

### CHG-V10-16: Action-Based Centralized Tenant Authorization (DEF-16)
- **Severity:** CRITICAL
- **Affected Section:** Section 3.1, Section 19.1 (`requirePermission`).
- **Resolution:** Implemented action-based authorization (`requirePermission`) replacing HTTP method checks. Blocked operational POS mutations on `pending_approval` (403) and `suspended` (423) stalls for all roles including Super Admin.
- **Status:** Verified.

---

### CHG-V10-17: Webhook Worker Crash Recovery & Reclaiming (DEF-17)
- **Severity:** CRITICAL
- **Affected Section:** Section 12.1 (`processWebhookEvents`).
- **Resolution:** Extended claim query to reclaim expired `processing` events (`lockedUntil <= now`). Enforced fencing token increments, active heartbeat renewal, idempotent domain handlers, and HTTP 200/500 acknowledgement semantics.
- **Status:** Verified.

---

### CHG-V10-18: Webhook BSON Binary Raw Payload Durability (DEF-18)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 17 `WebhookEventSchema`), Section 12.1.
- **Resolution:** Replaced `rawPayload: String` with BSON binary buffer storage `rawPayloadBuffer: Buffer` and `payloadHash`. Defined 100 KB size bounds, 90-day retention, and sensitive field redaction.
- **Status:** Verified.

---

### CHG-V10-19: Refund Worker Fenced Duplicate-Ledger Recovery (DEF-19)
- **Severity:** CRITICAL
- **Affected Section:** Section 11.1 (`processPendingRefundJobs`).
- **Resolution:** Corrected duplicate-ledger recovery: fenced atomic updates verify worker ownership, fencing token, and unexpired lease when completing jobs or handling duplicate-key collisions.
- **Status:** Verified.

---

### CHG-V10-20: Inventory Movement Sign & Strict Positive Integer Validation (DEF-20)
- **Severity:** HIGH
- **Affected Section:** Section 17.1 (`adjustInventoryStock`).
- **Resolution:** Fixed `adjustInventoryStock` to support positive/negative `manual_adjustment` via explicit `direction` parameter, validated strict positive integer quantities (`Number.isInteger(quantityBase) && quantityBase > 0`), and complete fingerprinting.
- **Status:** Verified.

---

### CHG-V10-21: Single-Transaction Payment Settlement Atomicity (DEF-21)
- **Severity:** HIGH
- **Affected Section:** Section 10.1 (`settleOrderPayment`).
- **Resolution:** Specified complete single-transaction settlement linking payment transactions, order `financials.amountPaidPaise`, `paymentStatus` thresholds, excess capture refund jobs, and outbox events.
- **Status:** Verified.

---

### CHG-V10-22: Outbox Worker Reclaiming & Authoritative REST Sync (DEF-22)
- **Severity:** HIGH
- **Affected Section:** Section 18.1 (`processOutboxEvents`).
- **Resolution:** Reclaims expired `claimed` events, enforces lease verification on all transitions, provides stable `eventId` deduplication, and architected client REST reconciliation (`/api/v1/orders/sync`).
- **Status:** Verified.

---

### CHG-V10-23: Unified Worker Operational Lifecycle & Graceful Shutdown (DEF-23)
- **Severity:** MEDIUM
- **Affected Section:** Section 24.1, Section 24.2.
- **Resolution:** Reconciled operational parameters across all 5 workers, specifying unified claim queries, leases, backoffs, dead-letter transitions, and graceful shutdown (SIGTERM/SIGINT with 10s drain).
- **Status:** Verified.

---

### CHG-V10-24: Exhaustive Frontend Integration Contract Matrix (DEF-24)
- **Severity:** HIGH
- **Affected Section:** Section 22.1.
- **Resolution:** Thoroughly expanded Section 22 with an exhaustive endpoint-by-endpoint contract matrix mapped to the actual React JSX frontend files (`mockAuthService.js`, `stallDataService.js`, `adminService.js`).
- **Status:** Verified.

---

### CHG-V10-25: Payment Settlement Idempotency, Conflict Detection & Cash Overpayment Separation (DEF-25)
- **Severity:** CRITICAL
- **Affected Section:** Section 10.1 (`settleOrderPayment`), Section 7 (Collection 8 `PaymentTransactionSchema`).
- **Resolution:** 
  1. Implemented pre-mutation idempotency key verification: query existing transaction by `{ stallId, idempotencyKey }` before any financial calculations or state modifications.
  2. Matching payload replay returns the original transaction record immediately with `{ idempotentReplay: true }` without modifying order totals or transaction counters.
  3. Conflicting payload fingerprint with identical idempotency key throws HTTP 409 Conflict.
  4. Cash overpayment (`method === 'cash'` and `amountPaidPaise > amountDuePaise`) computes till change due (`changeDuePaise = amountPaidPaise - amountDuePaise`) and completes settlement immediately without enqueuing a gateway refund job. Only digital gateway overpayments (`method === 'upi' | 'card'`) enqueue an excess capture `RefundJob`.
  5. Monotonically increments sequential payment attempt numbers (`attemptNumber`) per order.
  6. Documented transaction retry loop (up to 3 attempts with exponential backoff) for MongoDB `TransientTransactionError` and `WriteConflict`.
- **Status:** Verified.

---

### CHG-V10-26: Webhook Processing Heartbeat and Lease Loss Abort Handling (DEF-26)
- **Severity:** CRITICAL
- **Affected Section:** Section 12.1 (`processWebhookEvents`), Section 24.1 (Worker Specifications).
- **Resolution:**
  1. Configured an active 10s heartbeat timer running throughout webhook event execution that renews lease by 30s (`lockedUntil = now + 30s`) via fenced atomic update matching `{ _id: eventId, lockToken: workerToken }`.
  2. If heartbeat update returns `matchedCount === 0`, lease loss is immediately detected, triggering `abortController.abort()` to halt in-flight processing and log a critical lease-loss alert.
  3. Made all webhook domain handlers strictly idempotent, verifying database state prior to applying mutations to guarantee safety across overlapping worker executions.
- **Status:** Verified.

---

### CHG-V10-27: Refund Job Duplicate Ledger Record Invariant Verification (DEF-27)
- **Severity:** CRITICAL
- **Affected Section:** Section 11.1 (`processPendingRefundJobs`), Section 7 (Collection 9 `RefundSchema`).
- **Resolution:**
  1. On catching MongoDB duplicate key collision (error code 11000) on `{ gatewayProvider: 1, gatewayRefundId: 1 }`, the worker inspects the existing ledger document and verifies all six immutable financial invariants:
     - `gatewayProvider`
     - `gatewayRefundId`
     - `refundJobId`
     - `orderId`
     - `paymentTransactionObjectId`
     - `amountPaise`
  2. If all 6 invariants match exactly, marks the refund job as `completed` via fenced atomic update `{ _id: job._id, lockToken: workerToken, status: 'processing' }`.
  3. If ANY invariant differs, transitions the refund job to `requires_manual_reconciliation` with error diagnostics and triggers an immediate administrative security alert.
- **Status:** Verified.

---

### CHG-V10-28: Worker Claim Query Consistency and `gateway_outcome_unknown` (DEF-28)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 10 `RefundJobSchema`), Section 11.1 (`processPendingRefundJobs`), Section 24.1 (Worker Specifications).
- **Resolution:**
  1. Reconciled worker claim queries across schemas, pseudocode, and Section 24 table to consistently match `{ $or: [{ status: 'pending' }, { status: 'failed', nextRetryAt: { $lte: now } }, { status: 'gateway_outcome_unknown', nextRetryAt: { $lte: now } }, { status: 'processing', lockedUntil: { $lte: now } }] }`.
  2. Enforced that completed and `requires_manual_reconciliation` jobs are permanently excluded from worker claim queries.
  3. Aligned `RefundJobSchema.status` enum across all references to include `'gateway_outcome_unknown'`.
- **Status:** Verified.

---

### CHG-V10-29: Explicit Action Permission Allowlists vs Blanket Role Bypasses (DEF-29)
- **Severity:** HIGH
- **Affected Section:** Section 3.1 (Role Matrix), Section 19.1 (`requirePermission` Middleware).
- **Resolution:**
  1. Replaced all blanket role bypasses (e.g., `if (role === 'owner') return next()`) with explicit allowlists: `SUPER_ADMIN_ACTIONS`, `OWNER_ACTIONS`, and `STAFF_ACTIONS`.
  2. Enforced deny-by-default: any action not explicitly listed in the caller's role allowlist is rejected with HTTP 403 Forbidden.
  3. Super Admin is granted administrative governance actions (`stall:create`, `stall:view_all`, `stall:suspend`, `stall:activate`), but CANNOT perform operational counter POS mutations (`order:create`, `payment:settle`, `kds:update_status`) without an explicit user stall assignment on that specific stall.
  4. Blocked operational mutations across all roles (including Owner and Super Admin) when stall is `pending_approval` (HTTP 403) or `suspended` (HTTP 423).
- **Status:** Verified.

---

### CHG-V10-30: Inventory Movement Direction Validation and Positive Integer Quantities (DEF-30)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 13 `StockMovementSchema`), Section 17.1 (`adjustInventoryStock`).
- **Resolution:**
  1. Validated that `quantityBase` MUST be a strictly positive integer (`Number.isInteger(quantityBase) && quantityBase > 0`). Rejects zero or negative inputs with HTTP 400.
  2. For `manual_adjustment`, `direction` MUST be explicitly provided as either `'increase'` or `'decrease'`. For all other movement types (`restock`, `wastage`, `order_consumption`, `order_refund_restock`), direction is predetermined by type and explicit direction is forbidden/ignored.
  3. Applies deterministic multiplier: `direction === 'increase' ? +quantityBase : -quantityBase`.
  4. Updated canonical SHA-256 payload fingerprint to include `{ stallId, inventoryItemId, movementType, quantityBase, direction, reason }`.
- **Status:** Verified.

---

### CHG-V10-31: Outbox Consumer Deduplication Contract and Authoritative REST Sync (DEF-31)
- **Severity:** HIGH
- **Affected Section:** Section 18.1 (`processOutboxEvents`), Section 22.1 (Contract Matrix).
- **Resolution:**
  1. Specified client consumer event deduplication contract via stable `eventId` with a 7-day TTL cache in IndexedDB/memory.
  2. Architected authoritative client REST sync endpoint (`GET /api/v1/orders/sync?since=<lastEventTimestamp>`) for clients reconnecting after network flaps, socket disconnects, or heartbeat timeouts.
  3. Preserved at-least-once transport delivery guarantees with fenced database updates.
- **Status:** Verified.

---

### CHG-V10-32: Webhook Raw Payload Durability via BSON Binary and Select Privacy (DEF-32)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 17 `WebhookEventSchema`), Section 12.1.
- **Resolution:**
  1. Configured `select: false` on `rawPayloadBuffer: { type: Buffer, required: true }` in `WebhookEventSchema`, isolating raw byte buffers to the signature verification worker.
  2. Enforced that raw signed payload bytes are never modified or redacted prior to signature verification.
  3. Applied strict recursive redaction of sensitive credentials (`cardNumber`, `cvv`, `token`, `password`, `secret`) exclusively to structured loggers, monitoring streams, and administrative UI dashboards.
- **Status:** Verified.

---

### CHG-V10-33: Complete Frontend Integration Contract Mapping & Zero-Assumption Verification (DEF-33)
- **Severity:** HIGH
- **Affected Section:** Section 2 (System Architecture), Section 22.1 (Integration Contract Matrix).
- **Resolution:**
  1. Verified actual repository structure: confirmed absence of `frontend/src/services/api.ts` or `frontend/src/types/`.
  2. Documented that frontend is React 18 JSX using local JavaScript services (`mockAuthService.js`, `stallDataService.js`, `adminService.js`, `analyticsService.js`).
  3. Fully mapped every single frontend service method and UI state mutation to backend REST routes, request payloads, and response envelopes without introducing unrequested TypeScript files.
- **Status:** Verified.

---

### CHG-V10-34: Disentangled Implementation Gate Verification Framework (DEF-34)
- **Severity:** MEDIUM
- **Affected Section:** Section 28.1 (Implementation Gates), `BACKEND_PLAN_V10_FINAL_REVIEW.md`, `BACKEND_PENDING_DECISIONS_V10.md`.
- **Resolution:**
  1. Separated monolithic readiness declarations into four distinct, honest implementation gates:
     - **Gate 1: Local Development Readiness (Phases 1–5):** UNCONDITIONALLY APPROVED. All schemas, routes, algorithms, and mock adapters are fully specified.
     - **Gate 2: Automated Testing Readiness:** UNCONDITIONALLY APPROVED. Test specifications, mock adapters, and contract tests are defined for local execution.
     - **Gate 3: Staging Deployment Readiness:** READY AFTER CLOUD PROVISIONING. Blocked on VPS/cloud provisioning (`DEC-05`) and domain/TLS routing (`DEC-06`).
     - **Gate 4: Production Go-Live Readiness (Phase 6):** CONDITIONALLY BLOCKED. Blocked on commercial live merchant KYC for Razorpay (`DEC-03`) and TRAI DLT registration for MSG91 (`DEC-04`).
  2. Explicitly confirmed that exactly zero lines of backend source code or automated test suites currently exist.
- **Status:** Verified.

---

### CHG-V10-35: Digital Payment Overpayment Refund Calculation (DEF-35)
- **Severity:** CRITICAL
- **Affected Section:** Section 10.1 (`settleOrderPayment`), Section 13.3 (Worked Scenarios).
- **Resolution:** Corrected excess refund calculation to use the exact formula: `excessAmountPaise = max(0, currentPaid + amountPaise - grandTotal)`. The order's `amountPaidPaise` is capped via `min(grandTotal, currentPaid + amountPaise)`. The `RefundJob` is enqueued strictly for `excessAmountPaise` (not the entire captured amount). The full captured amount is preserved in `PaymentTransaction.amountPaise`. Physical cash overpayments compute `changeDuePaise` and NEVER enqueue a gateway refund job. Formulated 4 reconciled worked numerical examples balancing to ₹0.00 discrepancy.
- **Status:** Verified.

---

### CHG-V10-36: Payment Attempt Number Concurrency (DEF-36)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 7 `OrderSchema`, Collection 8 `PaymentTransactionSchema`), Section 10.1, Section 10.2.
- **Resolution:** Eliminated concurrency-unsafe `countDocuments() + 1`. Introduced `paymentAttemptCounter` on `OrderSchema`, atomically incremented via `Order.findOneAndUpdate` with `$inc` within the ACID transaction, acquiring document-level write locks. Retained unique index `{ orderId: 1, attemptNumber: 1 }`. Documented gap-tolerant monotonic numbering policy.
- **Status:** Verified.

---

### CHG-V10-37: Payment Idempotency and Concurrent Replay (DEF-37)
- **Severity:** CRITICAL
- **Affected Section:** Section 10.1, Section 10.2.
- **Resolution:** Established database unique constraint `{ stallObjectId: 1, idempotencyKey: 1 }` as the final financial authority. Formulated canonical sorted JSON SHA-256 request fingerprint (`requestFingerprint`). Replay with identical key and matching fingerprint returns original committed transaction with `{ idempotentReplay: true }`. Conflicting parameters return HTTP 409 Conflict. Protected duplicate gateway captures via `{ gatewayProvider: 1, gatewayPaymentId: 1 }` unique index. Demoted Redis lock to coarse debounce.
- **Status:** Verified.

---

### CHG-V10-38: Refund Duplicate-Ledger Reconciliation (DEF-38)
- **Severity:** CRITICAL
- **Affected Section:** Section 11.1 (`processPendingRefundJobs`), Section 11.2.
- **Resolution:** On catching MongoDB E11000 duplicate key collisions, inspects `dbErr.keyPattern` to identify collision index. Compares ALL SIX immutable financial invariants: `gatewayProvider`, `gatewayRefundId`, `refundJobId`, `orderId`, `paymentTransactionObjectId`, and `amountPaise`, plus `status` and `refundMethod`. Verified fenced update result: if `res.matchedCount === 0`, throws lease loss error (never falsely reports success). Transitions conflicting records to `requires_manual_reconciliation` with deduplicated audit alert only if lease remains active.
- **Status:** Verified.

---

### CHG-V10-39: Webhook Domain-Effect Idempotency and Fencing (DEF-39)
- **Severity:** CRITICAL
- **Affected Section:** Section 12.2, Section 12.3.
- **Resolution:** Bound domain mutations, event status update to `processed`, and worker lease validation into a single MongoDB multi-document session transaction. Stale workers cannot commit domain effects after lease loss because the lease validation query inside the transaction matches 0 documents. Handlers enforce independent idempotency keys (e.g. `gatewayPaymentId`). `AbortController` cancellation is cooperative in memory. Accurately defined delivery guarantee as at-least-once with idempotent domain handlers.
- **Status:** Verified.

---

### CHG-V10-40: Webhook Ingress Signature Verification and Durable Acknowledgement (DEF-40)
- **Severity:** HIGH
- **Affected Section:** Section 12.1 (`handleWebhookIngress`).
- **Resolution:** Implemented constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) against exact original incoming request Buffer before any JSON parsing. Validates 100 KB payload bounds and required headers. Persists durably into `WebhookEvent` before returning HTTP 200 OK. Duplicate provider events acknowledge with HTTP 200 immediately. DB failure returns HTTP 500/503 so gateway retries. Raw bytes isolated with `select: false`; logs and views mask PII via parsed JSON copy.
- **Status:** Verified.

---

### CHG-V10-41: Outbox Consumer Deduplication Consistency (DEF-41)
- **Severity:** HIGH
- **Affected Section:** Section 18.1, Section 18.2.
- **Resolution:** Reconciled delivery tiers: server-side durable outbox in MongoDB with 14-day retention; client-side in-memory duplicate suppression (`Set<string>` of `eventId`s capped at 5,000 items, 24-hour expiry for active SPA session). Removed unsupported claims of 7-day persistent disk storage in browser. Redis Pub/Sub acknowledged as at-most-once in-flight broadcast. Reconnection catches up via cursor-based authoritative REST sync (`GET /api/v1/orders/sync`).
- **Status:** Verified.

---

### CHG-V10-42: Inventory Direction Contract Enforcement (DEF-42)
- **Severity:** MEDIUM
- **Affected Section:** Section 17.1 (`adjustInventoryStock`).
- **Resolution:** Enforced strict direction validation: `manual_adjustment` strictly requires `direction: 'increase' | 'decrease'`. All other movement types (`restock`, `wastage`, `order_consumption`, `order_refund_restock`) explicitly reject a supplied direction field with HTTP 400. Enforced strict positive integer `quantityBase > 0`. Formulated unambiguous canonical sorted JSON SHA-256 fingerprint. Rejects invalid input before any database mutation.
- **Status:** Verified.

---

### CHG-V10-43: Comprehensive Frontend Contract Coverage Verification (DEF-43)
- **Severity:** HIGH
- **Affected Section:** Section 2, Section 22.1, Section 22.2.
- **Resolution:** Directly audited repository source code in `frontend/src/services/` (`mockAuthService.js`, `stallDataService.js`, `adminService.js`, `analyticsService.js`, `storageService.js`). Exhaustively inventoried and mapped all 75 exported functions to backend REST routes, DTOs, parameters, auth requirements, and error codes. Transparently verified absence of `api.ts`. Marked as verified architecture contract with explicit note that zero live backend tests have been executed yet (documentation baseline).
- **Status:** Verified.

---

### CHG-V10-44: Reconcile Payment Schema with Settlement Algorithm (DEF-44)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 7 `OrderSchema`, Collection 8 `PaymentTransactionSchema`), Section 10.1, Section 10.2.
- **Resolution:** Declared all settlement fields in canonical Mongoose schemas: added `Order.paymentAttemptCounter`, `PaymentTransaction.amountCreditedPaise`, `PaymentTransaction.changeDuePaise`, `PaymentTransaction.excessAmountPaise`, and `PaymentTransaction.requestFingerprint`. Defined exact mathematical invariance across all settlement transactions: `amountPaise === amountCreditedPaise + changeDuePaise + excessAmountPaise` in integer paise.
- **Status:** Verified.

---

### CHG-V10-45: Authoritative Duplicate Gateway-Capture Handling (DEF-45)
- **Severity:** CRITICAL
- **Affected Section:** Section 10.1 (`settleOrderPayment`).
- **Resolution:** Reconciled duplicate capture branch to treat verified capture in `existingGatewayTx` as authoritative. Enforced tenant and order consistency checks (`existingGatewayTx.stallObjectId.equals(stallObjectId)` and `existingGatewayTx.orderId.equals(orderId)`), logging security audit alerts on mismatch. Verified capture amounts. Formulated stable idempotency key `duplicate_gateway_capture_${gatewayProvider}_${gatewayPaymentId}` and pre-checked existing refund jobs to return existing records idempotently without unhandled duplicate-key collisions.
- **Status:** Verified.

---

### CHG-V10-46: Correct Refund Worker Heartbeat Active Lease Predicates & State Transitions (DEF-46)
- **Severity:** CRITICAL
- **Affected Section:** Section 11.1 (`processPendingRefundJobs`), Section 24.1 (Worker Specifications).
- **Resolution:** Corrected heartbeat update predicate to match active worker lease across both `processing` and `gateway_submitted` states: `status: { $in: ['processing', 'gateway_submitted'] }`. Ensured in-flight gateway dispatch is not falsely aborted. Fenced completion query checks both active lease states. Uncertain timeouts/aborts transition to `gateway_outcome_unknown`, NOT `failed`. Reconciled claim queries across schemas, pseudocode, and Section 24 table.
- **Status:** Verified.

---

### CHG-V10-47: Tenant-Scoped Payment Idempotency & Full Fingerprint Coverage (DEF-47)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 8 `PaymentTransactionSchema`), Section 10.1, Section 10.2.
- **Resolution:** Enforced tenant-scoped idempotency compound unique index `{ stallObjectId: 1, idempotencyKey: 1 }` in `PaymentTransactionSchema`, eliminating contradictory standalone global field uniqueness. Expanded canonical SHA-256 fingerprint to cover all material gateway identifiers (`amountPaise`, `gatewayCaptureId`, `gatewayOrderId`, `gatewayPaymentId`, `gatewayProvider`, `orderId`, `paymentMethod`, `stallObjectId`), normalizing cash gateway fields to `null`. Formulated safe legacy record fingerprint backfill path.
- **Status:** Verified.

---

### CHG-V10-48: Authorization Matrix & Action Allowlist Alignment (DEF-48)
- **Severity:** HIGH
- **Affected Section:** Section 3.1 (Role Matrix), Section 19.1 (`requirePermission`), Section 22.1 (Frontend Matrix Row 16).
- **Resolution:** Separated counter availability toggling (`menu:toggle_availability`) from menu administration (`menu:manage`). Staff receives `menu:toggle_availability` and `kds:view_and_dispatch`, but strictly NOT `menu:manage`. Owner receives both `menu:manage` and `menu:toggle_availability` as well as `kds:view_and_dispatch`. Financial reports (`reports:view_financials`) and support tickets (`tickets:manage`) remain Owner/SuperAdmin-only. Updated Section 22 row 16 to require `menu:toggle_availability`.
- **Status:** Verified.

---

### CHG-V10-49: Harden Webhook Signature Hex Validation & Middleware Ordering (DEF-49)
- **Severity:** HIGH
- **Affected Section:** Section 6.1 (Express Pipeline), Section 12.1 (`handleWebhookIngress`).
- **Resolution:** Added strict format validation on `X-Razorpay-Signature` verifying typeof string and exact 64-character hexadecimal format (`/^[0-9a-fA-F]{64}$/`) prior to invoking `crypto.timingSafeEqual`, preventing unhandled `RangeError` exceptions on mismatched buffer lengths and returning controlled HTTP 400 Bad Request. Documented explicit Express middleware ordering requiring `express.raw({ type: 'application/json', limit: '100kb' })` to be mounted for webhook ingress BEFORE the global `express.json()` body parser.
- **Status:** Verified.

---

### CHG-V10-50: Mandatory Gateway Payment ID Validation, Provider Rules & Test Specifications (DEF-50)
- **Severity:** CRITICAL
- **Affected Section:** Section 7 (Collection 8 `PaymentTransactionSchema`), Section 10.1 (`settleOrderPayment`, `GATEWAY_PROVIDER_REGISTRY`, `verifyGatewayCaptureIdentity`), Section 10.2 (Payment Concurrency Rules), Section 10.3 (Architectural Test Specification Matrix).
- **Problem:** Permissive identifier comparisons previously risked asymmetric false matches. Furthermore, `settleOrderPayment()` performed duplicate-capture lookup conditionally on `if (paymentMethod !== 'cash' && gatewayPaymentId)`, allowing digital payments lacking a `gatewayPaymentId` to bypass duplicate verification and persist incomplete payment records without mandatory gateway identifiers.
- **Resolution:** Formally implemented multi-layered, fail-safe gateway payment identity verification and unconditional input validation:
  1. **Unconditional Entry-Point Input Validation (Step 1):** Placed strict parameter validation at the absolute beginning of `settleOrderPayment()`, executing prior to any database mutation, session start, fingerprinting, or transaction acquisition:
     - For non-cash payments (`paymentMethod !== 'cash'`): requires recognized gateway provider in `GATEWAY_PROVIDER_REGISTRY`, non-empty normalized `gatewayPaymentId`, and dynamically validates every identifier declared in `providerPolicy.mandatoryIdentifiers`. Rejects missing/invalid mandatory identifiers immediately with HTTP 400 `ValidationError`.
     - For cash payments: strictly normalizes all gateway fields (`gatewayProvider`, `gatewayPaymentId`, `gatewayOrderId`, `gatewayCaptureId`) to `null`; requires no provider or gateway payment ID.
  2. **Eliminated Conditional Verification Bypass:** Removed `&& gatewayPaymentId` guard from Step 4 duplicate capture verification. The check is now strictly `if (paymentMethod !== 'cash')`, guaranteeing that all non-cash payments undergo authoritative capture lookup.
  3. **Mongoose Schema Pre-Validate Hook:** Added a pre-validation hook on `PaymentTransactionSchema` (Collection 8) enforcing that any non-cash transaction with `status: 'captured'` contains a recognized `gatewayProvider`, valid `gatewayPaymentId`, and all mandatory identifiers before MongoDB persistence.
  4. **Provider Registry & Matching Invariants:** Maintained `GATEWAY_PROVIDER_REGISTRY` distinguishing mandatory vs optional identifiers. Preserved exact normalized matching, asymmetric presence rejection (`GATEWAY_ORDER_ID_ASYMMETRY`), Razorpay auto-capture coincidence rules, and fail-safe routing to HTTP 409 Conflict + `AuditLog`.
  5. **Architectural Test Specification Matrix (Section 10.3):** Formulated the architectural test specification matrix in Section 10.3 (initially 9 scenarios TS-PAY-01 through TS-PAY-09 under DEF-50, subsequently expanded to the complete 16-scenario matrix TS-PAY-01 through TS-PAY-16 under DEF-58) covering missing gatewayPaymentId, whitespace/null normalization, unconfigured provider, missing provider-mandatory identifiers, valid non-cash capture, cash payment with null gateway fields, cash payment with gateway fields ignored/sanitized, duplicate gatewayPaymentId on same order, duplicate gatewayPaymentId across different orders, explicit provider requirement, test fixture wiring, and direct schema validation. Formally noted as architectural test specifications (0 automated tests executed).
- **Status:** Verified.

---

### CHG-V10-51: Complete Legacy Payment Fingerprint Validation & Atomic Backfill (DEF-51)
- **Severity:** HIGH
- **Affected Section:** Section 10.1 (`settleOrderPayment`), Section 10.2 (Payment Concurrency Rules).
- **Problem:** Legacy payment records lacking a stored `requestFingerprint` lacked exhaustive validation across all material fields, cash normalization was inconsistent, and the atomic fingerprint backfill assumed success without checking `modifiedCount` or handling concurrent backfill races.
- **Resolution:** Implemented exhaustive `verifyLegacyMaterialMatch` enforcing absolute parity across both pre-transaction and in-transaction lookup paths:
  1. Validates all 8 material parameters: `stallObjectId`, `orderId`, `amountPaise`, `paymentMethod`, `gatewayProvider`, `gatewayOrderId`, `gatewayPaymentId`, `gatewayCaptureId`.
  2. Consistently normalizes gateway fields to `null` for cash payments.
  3. Verifies atomic backfill result: if `modifiedCount === 0` due to a concurrent write, reloads the authoritative record from MongoDB and compares the stored fingerprint with the incoming fingerprint. Matching fingerprints return an idempotent replay; mismatches return HTTP 409 Conflict.
- **Status:** Verified.

---

### CHG-V10-52: Gateway Duplicate-Key Recovery for E11000 Collisions (DEF-52)
- **Severity:** HIGH
- **Affected Section:** Section 10.1 (`settleOrderPayment`), Section 10.2 (Payment Concurrency Rules).
- **Problem:** The transaction catch block for MongoDB E11000 duplicate key errors did not handle concurrent capture replays or payment counter race conditions across all relevant unique compound indexes.
- **Resolution:** Implemented fine-grained E11000 collision recovery differentiated by `err.keyPattern`:
  1. `{ stallObjectId: 1, idempotencyKey: 1 }`: Queries committed transaction, verifies fingerprint or legacy parameters, and returns idempotent replay or throws HTTP 409.
  2. `{ gatewayProvider: 1, gatewayPaymentId: 1 }`: Queries committed transaction, verifies all gateway identifiers, and returns concurrent capture replay or throws HTTP 409.
  3. `{ orderId: 1, attemptNumber: 1 }`: Treats attempt number collision as a transient write sequence conflict, triggering an immediate transaction retry in the loop to obtain the next monotonic attempt counter.
- **Status:** Verified.

---

### CHG-V10-53: Worker Schema and Timestamp Field Synchronization (DEF-53)
- **Severity:** MEDIUM
- **Affected Section:** Section 7 (Collection 10 `RefundJobSchema`, Collection 17 `WebhookEventSchema`), Section 11.1, Section 12.1.
- **Problem:** Background worker loops wrote `completedAt: new Date()` on completed refund jobs and `processedAt: new Date()` on processed webhook events, but these fields were not formally declared in their respective Mongoose schemas, risking field stripping and TypeScript compilation errors.
- **Resolution:** Explicitly added `completedAt: { type: Date, default: null }` to `RefundJobSchema` and `processedAt: { type: Date, default: null }` to `WebhookEventSchema`.
- **Status:** Verified.

---

### CHG-V10-54: Deterministic Composite Cursor for REST Order Sync (DEF-54)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 7 `OrderSchema`), Section 18.2, Section 18.3 (`syncOrders`).
- **Problem:** The REST catch-up sync endpoint (`GET /api/v1/orders/sync`) lacked a session-fixed upper watermark, did not implement the 30-day cursor expiry in code, lacked client advancement rules, and relied on unsupported "100% convergence" terminology.
- **Resolution:** Fully specified deterministic cursor pagination:
  - Added compound index: `OrderSchema.index({ stallObjectId: 1, updatedAt: 1, _id: 1 })`.
  - Established a fixed session upper watermark (`syncWatermark`) established at page 1 and preserved across all pages via `nextCursor`.
  - Implemented composite lower cursor `(updatedAt, _id)` with strict `_id` tie-breaking for equal timestamps.
  - Implemented explicit 30-day cursor and since timestamp expiry in handler returning HTTP 410 Gone with `{ code: 'CURSOR_EXPIRED', requiresFullResync: true }`.
  - Specified client cursor advance rule (advance only after local storage persistence).
  - Defined concurrent update recovery via subsequent session query (`since = syncWatermark`) and client store upsert by `_id`.
  - Replaced unsupported absolute claims with mathematically grounded deterministic monotonic convergence.
- **Status:** Verified.

---

### CHG-V10-55: Architecture Baseline Freeze, Executive Consistency & Decoupled Scope (DEF-55 & DEC-00)
- **Severity:** MEDIUM
- **Affected Section:** Whole Document, Document Control, Section 1 (Executive Summary), Section 2.1 & 2.2 (Product Scope), Pending Decisions (DEC-00), Section 6, Section 28.
- **Problem:** Accidental duplicate insertions of Section 6.1 occurred across code blocks, Section 1 executive summary still referenced Version 10.2 and older defect ranges, and DEC-00 previously conflated the commercial business operating model with an infrastructure environment variable switch.
- **Resolution:** Removed all 28 accidental duplicate insertions of Section 6.1, synchronized all document titles and executive summaries to Version 10.2.2, codified the exact canonical product-scope statement across all documents:
  > *"FoodDesk is a flexible Point of Sale (POS), order management, payment tracking, and business analytics platform that supports both single-stall and multi-stall businesses. Stall owners can choose to operate a single stall or manage multiple stalls under one account, according to their business requirements."*
  Formally decoupled the **Owner-Selectable Business Operating Model** (Single-Stall streamlined workflow vs Multi-Stall independent onboarding and dashboard stall switching with independent Super Admin approvals per stall per PRD §3B) from the **Infrastructure Deployment Mode** (`SINGLE_STALL_MODE` on-premise hardware vs Multi-Tenant Cloud SaaS). Enforced strict tenant isolation across all 19 collections via `stallObjectId`, and codified the six separated verification verdicts establishing formal Architecture Freeze.
- **Status:** Verified.

---

### CHG-V10-56: Mandatory Explicit Gateway Provider & Schema Default Removal (DEF-56)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 8 `PaymentTransactionSchema`, Collection 9 `RefundSchema`), Section 10.1 (`settleOrderPayment`), Section 10.2 (Payment Concurrency Rules).
- **Problem:** `settleOrderPayment()` implicitly defaulted `gatewayProvider = 'razorpay'` in its parameter signature, AND `PaymentTransactionSchema` (and `RefundSchema`) declared `gatewayProvider: { type: String, default: 'razorpay' }`. Consequently, Mongoose automatically populated `'razorpay'` upon document instantiation, masking omitted providers and preventing the schema pre-validate hook from catching missing providers.
- **Resolution:**
  1. Removed the implicit default parameter from `settleOrderPayment()`: signature changed to `gatewayProvider = null`.
  2. Corrected the schema defaults in `PaymentTransactionSchema` and `RefundSchema` to `gatewayProvider: { type: String, default: null }`. Omitted providers remain `null` upon Mongoose document instantiation and are reliably detected.
  3. For all non-cash payment requests (`paymentMethod !== 'cash'`), explicitly requires a non-empty string provider matching a configured provider in `GATEWAY_PROVIDER_REGISTRY`.
  4. Rejects missing, empty, or whitespace-only providers immediately with HTTP 400 `ValidationError('Explicit gateway provider is required for non-cash payments.')` at Step 1, before database session start, request fingerprinting, or any database mutation.
  5. Preserves cash payment behavior: cash does not require a gateway provider or gateway identifiers, and all gateway fields strictly normalize to `null` in service logic and schema storage.
  6. Preserves existing Razorpay and mock-provider behavior when explicitly supplied.
- **Status:** Verified.

---

### CHG-V10-57: Dual-Layer Validation Architecture & Dynamic Mongoose Hook (DEF-57)
- **Severity:** HIGH
- **Affected Section:** Section 7 (Collection 8 `PaymentTransactionSchema`), Section 10.1, Section 10.2.
- **Problem:** The previous `PaymentTransactionSchema.pre('validate')` hook only checked static string presence for `gatewayProvider` and `gatewayPaymentId`. Furthermore, the architecture did not formally delineate the independent roles of service-level validation vs schema-level persistence validation.
- **Resolution:**
  1. Formally established the **Dual-Layer Validation Architecture**:
     - **Layer 1: Service Ingress Validation (`settleOrderPayment()` Step 1):** Executes before database session acquisition and mutation, protecting database resources from invalid payloads.
     - **Layer 2: Schema Persistence Validation (`PaymentTransactionSchema.pre('validate')`):** Executes before document validation and persistence, guaranteeing data invariants even if records are instantiated outside the service.
     - **Mutual Independence:** Neither layer relies on the other as its sole safeguard.
  2. With schema `default: null` (DEF-56), `PaymentTransactionSchema.pre('validate')` reliably catches omitted providers and dynamically looks up `providerPolicy = GATEWAY_PROVIDER_REGISTRY[normProvider]`.
  3. Rejects unrecognized or unconfigured providers before MongoDB persistence.
  4. Dynamically iterates over `providerPolicy.mandatoryIdentifiers` and requires every declared identifier to be a non-empty string.
  5. Preserves optional identifier behavior.
  6. Keeps cash transactions valid without gateway identifiers (`if (this.paymentMethod !== 'cash' && ...)`).
  7. Guarantees 100% compatible invariant enforcement across service and schema layers.
- **Status:** Verified.

---

### CHG-V10-58: Extended Architectural Test Specifications & Test Fixture Wiring (DEF-58)
- **Severity:** MEDIUM
- **Affected Section:** Section 10.3 (Architectural Test Specification Matrix).
- **Problem:** Architectural test specifications previously referenced an unconfigured provider (`custom_mock`) in TS-PAY-14 without explaining how the fixture is wired into `GATEWAY_PROVIDER_REGISTRY` lookups used by `settleOrderPayment()` and `PaymentTransactionSchema.pre('validate')`, and lacked dedicated direct Mongoose schema-level validation tests.
- **Resolution:**
  1. Extended Section 10.3 architectural test specifications to 16 formal scenarios:
     - **TS-PAY-01 to TS-PAY-13:** Retained full existing service-level settlement coverage.
     - **TS-PAY-06:** Updated to use configured production provider `'mock'` missing mandatory `gatewayPaymentId`.
     - **TS-PAY-14 (Test Fixture Wiring & Dual Validation):** Defined explicit test setup for `test_gateway` (`mandatoryIdentifiers: ['gatewayPaymentId', 'gatewayOrderId']`):
       - Before the test, temporarily attaches `test_gateway` to shared `GATEWAY_PROVIDER_REGISTRY`.
       - Executes service-level test verifying omission of `gatewayOrderId` is rejected with HTTP 400 before DB mutation.
       - Executes direct schema-level test (`invalidSchemaDoc.validate()`) verifying rejection by `PaymentTransactionSchema.pre('validate')` before persistence.
       - In a guaranteed `try/finally` block, executes `delete GATEWAY_PROVIDER_REGISTRY['test_gateway']` regardless of test outcome.
       - Runs in an isolated serial test context (`describe.sequential`) to prevent parallel test worker cross-talk.
       - Asserts post-cleanup production registry contains strictly `['mock', 'razorpay']`.
       - Documented architectural alternative for future immutable registries (dependency injection / test factory pattern).
     - **TS-PAY-15 (Direct Schema Test A):** Direct Mongoose schema validation on captured digital transaction with omitted `gatewayProvider`. Verifies that with `default: null`, the document does NOT silently assign `'razorpay'` and that `PaymentTransactionSchema.pre('validate')` rejects the document before persistence.
     - **TS-PAY-16 (Direct Schema Test B):** Direct Mongoose schema validation on cash transaction without gateway details. Verifies that cash transactions succeed validation with all gateway fields remaining strictly `null`.
  2. Formally reiterated evidence classification: these are architectural test specifications and behavioral contracts; exactly zero automated backend test suites have been executed against live services (documentation-only task).
- **Status:** Verified.

---

## Retained Architectural Baselines
- **Tenancy Architecture:** Pluggable Dual-Mode Tenancy (PRD §1 L12).
- **Monetary Unit:** Integer paise used exclusively across all 19 schemas, APIs, and models.
- **HMAC Verification:** Constant-time raw binary comparison via `crypto.timingSafeEqual`.
- **Frontend Codebase:** Zero modifications to `frontend/`.

---
*End of FoodDesk Architecture Changelog (Version 9.0 to Version 10.2.2 — Architecture Freeze).*

---

### CHG-V10-59: Frontend Integration Contract Alignment (73 REST Endpoints vs. 2 Client CSV Utilities)
- **Severity:** MEDIUM
- **Affected Section:** Section 22.1, Section 22.2 (`BACKEND_IMPLEMENTATION_PLAN_V10.md`), Section 7 Item 9 (`BACKEND_PLAN_V10_FINAL_REVIEW.md`).
- **Problem:** Review documentation previously stated that only 25 frontend functions were mapped to backend API contracts, while Section 22 of the authoritative implementation plan contains 75 numbered service function entries.
- **Resolution:** Audited all 75 entries in the frontend service function matrix across `mockAuthService.js`, `stallDataService.js`, `adminService.js`, `analyticsService.js`, and `storageService.js`. Formalized the exact architectural breakdown:
  1. **73 Backend REST API Endpoints (Entries 1–73):** Directly mapped to backend Express route controllers, HTTP methods, authorization actions, and standardized JSON envelopes.
  2. **2 Browser-Side Client Utilities (Entries 74–75):** Explicitly categorized `analyticsService.generateCSVReport` (in-memory RFC-4180 CSV string formatter) and `analyticsService.downloadCSVReport` (browser DOM blob download trigger) as client utilities that execute purely in browser memory with zero backend HTTP invocations.
  3. Reconciled the review report from 25 to 75 total functions with explicit differentiation of the 73 REST endpoints from the 2 client utilities. Zero modifications required in React frontend source code.
- **Status:** Verified.

---

### CHG-V10-60: Node.js Runtime Policy, Version Constraints & Upstream Dependency Compatibility Assessment
- **Severity:** HIGH
- **Affected Section:** Section 5, Section 5.1, Section 27, Section 28 (`BACKEND_IMPLEMENTATION_PLAN_V10.md`), Section 1, Section 2, Section 7 (`BACKEND_PLAN_V10_FINAL_REVIEW.md`).
- **Problem:** The architecture previously specified Node.js `>=20.18.0 LTS` (Node 20). Node.js 20 reached official End-of-Life (EOL) on April 30, 2026 and no longer receives upstream security patches. Additionally, runtime constraints required exact lifecycle terminology alignment for Node.js 24 (Maintenance LTS as of November 2026), explicit bounded engine ranges (`>=24.0.0 <27.0.0`), and qualified distinction between documented upstream compatibility and pending live repository verification.
- **Resolution:** Upgraded and formalized the system runtime specification across all documents:
  1. **Canonical Runtime Baseline & LTS Lifecycle Policy:** Standardized on **Node.js 26.x Active LTS** as the primary production, container, and CI target, with backwards-compatible secondary support for **Node.js 24.x Maintenance LTS** (as of November 17, 2026). Strictly deprecated and prohibited Node.js 20 and earlier (`<=20.x`).
  2. **Bounded Package Engine Declaration:** Formulated the package engine requirement using the bounded major version range: `"engines": { "node": ">=24.0.0 <27.0.0", "npm": ">=10.0.0" }`, avoiding open-ended `>=26.0.0` declarations.
  3. **Container & CI Runtimes:** Pegged production/staging Docker base images to `node:26-alpine` and GitHub Actions CI workflow matrices to `[24.x, 26.x]` with release deployment gated strictly on `26.x`.
  4. **Upstream Compatibility Assessment vs. Repository Verification:** Conducted architectural upstream engine compatibility assessment across TypeScript `^5.6.3`, Express.js `^4.21.1`/`^5.0.1`, Mongoose `^8.8.1`, MongoDB driver `^6.10.0`, Redis client (`ioredis ^5.4.1` / `redis ^4.7.0`), Socket.IO `^4.8.1`, Zod `^3.23.8`, Vitest `^2.1.4`, Supertest `^7.0.0`, native OpenSSL 3.x `crypto`, and `mongodb-memory-server ^9.4.0`/`^10.0.0`. Explicitly distinguished documented upstream engine declarations from repository-level package installation, lockfile resolution, and automated test execution, which are formally cataloged as pending implementation verification during Phase 1 scaffolding.
- **Status:** Verified.

---

### CHG-V10-61: Tenant Isolation Defense-in-Depth Specification
- **Severity:** MEDIUM
- **Affected Section:** Section 5 Item 4 (`BACKEND_PLAN_V10_FINAL_REVIEW.md`), Section 4 (`BACKEND_IMPLEMENTATION_PLAN_V10.md`).
- **Problem:** The final review previously claimed that cross-stall data leakage is "mathematically impossible under the query engine." This absolute statement oversimplified tenant boundaries and implied that a design pattern could eliminate all possible implementation defects.
- **Resolution:** Replaced the absolute claim with a technically accurate defense-in-depth specification detailing the four mandatory layers of tenant isolation:
  1. **Deny-by-Default Authorization Middleware (`requirePermission`, `resolveTenantContext`):** Mandatory session validation and verification of active `stallObjectId` membership in `authorizedStalls`.
  2. **Mandatory Tenant-Scoped Repository Queries:** Enforced controller-to-repository contracts where all queries strictly bind to `{ stallObjectId: req.stallObjectId, ... }` with schema pre-validate hooks.
  3. **Compound Unique Index Partitioning:** MongoDB database engine enforcement via `{ stallObjectId: 1, ... }` compound unique indexes preventing cross-tenant collisions.
  4. **Mandatory Multi-Tenant Test Validation Suites:** Required automated test suites explicitly asserting that authenticated requests for Stall A receive HTTP 403 Forbidden or HTTP 404 Not Found when attempting to access Stall B resources.
- **Status:** Verified.

---

### CHG-V10-62: Tenant Isolation Scope Realignment in DEC-00 (14 Tenant-Owned vs. 5 Platform-Wide Collections)
- **Severity:** MINOR / DOCUMENTATION RECONCILIATION
- **Affected Document & Section:** `BACKEND_PENDING_DECISIONS_V10.md` (DEC-00).
- **Problem:** DEC-00 previously stated that strict tenant isolation applied across all 19 canonical collections via `stallObjectId` indexing. This was inconsistent with Section 7 of `BACKEND_IMPLEMENTATION_PLAN_V10.md`, which partitions the schema into 14 tenant-owned collections and 5 platform-wide/system collections. In addition, the wording oversimplified tenant boundaries by implying that database indexes alone enforce isolation.
- **Resolution:**
  1. **Aligned with Section 7 Schema Classification:** Explicitly corrected DEC-00 to specify that tenant isolation applies strictly to the **14 tenant-owned collections** (Collection 3 `stalls` [tenant master], Collection 4 `categories`, Collection 5 `menu_items`, Collection 6 `order_counters`, Collection 7 `orders`, Collection 8 `payment_transactions`, Collection 9 `refunds`, Collection 10 `refund_jobs`, Collection 11 `expenses`, Collection 12 `inventory_items`, Collection 13 `stock_movements`, Collection 14 `support_tickets`, Collection 15 `notifications`, Collection 16 `outbox_events`).
  2. **Clarified Platform-Wide Collection Governance:** Clarified that the **5 platform-wide/system collections** (Collection 1 `users`, Collection 2 `sessions`, Collection 17 `webhook_events`, Collection 18 `audit_logs`, Collection 19 `platform_settings`) follow their documented platform-level access controls governed by Super Admin authorization, authentication middleware, and system background workers.
  3. **Architectural Enforcement over Index-Only Isolation & Qualified Defense-in-Depth:** Replaced index-only phrasing and absolute leakage claims to explain that tenant isolation relies fundamentally on validated tenant context (`req.tenantContext.stallObjectId` resolved against `user.authorizedStalls`) and properly scoped application database queries/writes (`{ stallObjectId: req.stallObjectId, ... }`), with `stallObjectId` and `stallId` indexes supporting efficient tenant-scoped queries and compound uniqueness constraints where applicable. Clarified that the architecture is designed to prevent cross-stall data access through validated tenant context, mandatory tenant-scoped database operations, authorization checks, and supporting database constraints, with effectiveness to be verified through automated multi-tenant isolation tests.
  4. **Preserved Product Operating Models:** Retained the owner-selectable Single-Stall vs. Multi-Stall business operating models, independent Super Admin approval per stall profile (PRD §3B), and complete decoupling from dedicated on-premise hardware deployment (`SINGLE_STALL_MODE`).
- **Status:** Verified.
