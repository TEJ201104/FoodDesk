# FoodDesk — Consolidated Backend Decision Register (Version 10.2.2 — Architecture Freeze)

---

## Executive Summary

| Attribute | Details |
| :--- | :--- |
| **Document Title** | FoodDesk Backend Architecture: Consolidated Stakeholder Decision Register (V10.2.2) |
| **File Location** | `D:\Projects\FoodDesk\BACKEND_PENDING_DECISIONS_V10.md` |
| **Document Version** | Version 10.2.2 Alignment (Architecture Freeze) |
| **Target Audience** | Project Owner, Lead Stakeholders, Solutions Architect, Backend Engineering Team, DevOps |
| **Purpose** | Present a transparent, structured catalog of all business, regulatory, architectural, and infrastructure decisions requiring formal stakeholder confirmation, classified by Category (Already Decided, Non-Blocking Development Decisions, Production-Blocking External Dependencies) and Phase Implementation Gate Status. |

---

## Classification Guidelines

- **Already Decided by Source Documents:** Explicitly settled in `PRD.txt`, `IMPLEMENTATION_PLAN.md`, or the approved frontend prototype. Requires no further architectural debate or developer guessing unless an intentional, formal scope revision is requested by the business stakeholder.
- **Non-Blocking for Development:** Implementation can proceed immediately across Phases 1 through 5 using a documented mock adapter, pluggable architecture, or sensible default without waiting for an external business or vendor decision.
- **Production-Blocking External Dependencies:** Development can proceed locally and across automated testing stages, but the system cannot be deployed to live public production without formal stakeholder sign-off, commercial agreements, and live vendor credentials.

---

## 1. Decisions Already Decided by Approved Source Documents

---

### DEC-00: Product Scope & Operating Model Confirmation (Owner-Selectable Single-Stall vs. Multi-Stall)

- **Decision ID:** `DEC-00`
- **Category:** Product Scope (Decided by Controlling Baseline & Stakeholder Confirmation)
- **Canonical Product-Scope Statement:**
  > *"FoodDesk is a flexible Point of Sale (POS), order management, payment tracking, and business analytics platform that supports both single-stall and multi-stall businesses. Stall owners can choose to operate a single stall or manage multiple stalls under one account, according to their business requirements."*
- **Source Document Evidence:**
  - `PRD.txt` Section 1, Line 12 explicitly states: *"It is a Multi-stall Point of Sale (POS), order management, payment tracking, and business analytics platform designed to simplify daily operations for individual food stall owners."*
  - `PRD.txt` Section 2 mandates the Super Admin role with platform-wide visibility and stall onboarding governance.
  - `PRD.txt` Section 3B mandates individual stall profile registration, status workflows (`pending_approval`, `active`, `suspended`), and independent Super Admin activation (*"If an existing stall owner registers another stall, the new stall profile must undergo a separate approval process without affecting their already approved stalls"*).
  - `PRD.txt` Section 14 mandates that every single data document must carry a `stallId` field and that an Owner can operate multiple food stalls under one account.
  - `PRD.txt` Section 19 mandates stall-level data isolation, dedicated digital menus, and independent daily sequence counters (`#001` per stall per business day).
  - The approved frontend prototype (`frontend/src/`) implements `user.authorizedStalls` in `mockAuthService.js` and stall switching in `StallContext.jsx`.
- **Settled Architecture in V10.2.2 (Decoupling Business Model from Infrastructure Deployment):**
  1. **Business Operating Model (Owner-Selectable):**
     - **Single-Stall Owner:** Operates exactly one food stall under their account. The counter interface, POS, KDS, inventory, and reports lock directly to this stall, providing a streamlined, distraction-free workflow with zero stall-switching overhead.
     - **Multi-Stall Owner:** Operates multiple food court outlets, cloud kitchens, or kiosks under a single verified account. Each additional stall profile follows the required independent Super Admin approval process per PRD §3B. The dashboard provides an intuitive stall switcher (`StallContext.jsx`) for cross-stall management.
     - **Strict Tenant Isolation (14 Tenant-Owned Collections):** Applies identically to both business models across all **14 tenant-owned collections** (Collection 3 `stalls` [tenant master], Collection 4 `categories`, Collection 5 `menu_items`, Collection 6 `order_counters`, Collection 7 `orders`, Collection 8 `payment_transactions`, Collection 9 `refunds`, Collection 10 `refund_jobs`, Collection 11 `expenses`, Collection 12 `inventory_items`, Collection 13 `stock_movements`, Collection 14 `support_tickets`, Collection 15 `notifications`, Collection 16 `outbox_events`). Tenant isolation relies fundamentally on validated tenant context (`req.tenantContext.stallObjectId` verified against `user.authorizedStalls`) and properly scoped application database queries and writes (where repository operations strictly bind to `{ stallObjectId: req.stallObjectId, ... }`), with `stallObjectId` and `stallId` indexes supporting efficient tenant-scoped queries and compound uniqueness constraints where applicable. The architecture is designed to prevent cross-stall data access through validated tenant context, mandatory tenant-scoped database operations, authorization checks, and supporting database constraints. Its effectiveness must be verified through automated multi-tenant isolation tests.
     - **Platform-Wide / System Collections (5 Collections):** The remaining **5 platform-wide / system collections** (Collection 1 `users`, Collection 2 `sessions`, Collection 17 `webhook_events`, Collection 18 `audit_logs`, Collection 19 `platform_settings`) follow their documented platform-level access and governance rules, accessible via platform Super Admin authorization, global authentication middleware, and system background workers.
     - **Super Admin Governance:** Applies identically to both models, maintaining independent oversight, approval, and audit trails per stall profile.
  2. **Infrastructure Deployment Mode (Distinct Infrastructure Concern):**
     - **Multi-Tenant Cloud SaaS (`SINGLE_STALL_MODE=false`, Default):** Standard cloud deployment hosting multiple owners and multiple stalls with dynamic `req.tenantContext` resolution.
     - **Dedicated Standalone Hardware Deployment (`SINGLE_STALL_MODE=true`):** Optional on-premise edge deployment (e.g. dedicated local POS terminal / Raspberry Pi) locked to a verified `DEFAULT_STALL_ID`. If `DEFAULT_STALL_ID` is missing or invalid, application boot halts immediately.
     - **Separation Principle:** An infrastructure deployment flag like `SINGLE_STALL_MODE` must never be confused with the owner's business-level operational choice. The business model is chosen by the stall owner during onboarding and growth; the deployment mode is an infrastructure configuration.
- **Consequences:** Satisfies 100% of PRD and frontend prototype requirements; zero UI refactoring required; cleanly separates business operational scale from infrastructure deployment topologies.
- **Decision Owner:** Product Owner & Lead Stakeholder.
- **Blocking Status:** **Decided / Unblocked for Development.**

---

### DEC-02: Automated Recipe / BOM Raw Ingredient Deduction

- **Decision ID:** `DEC-02`
- **Category:** Product Scope (Decided by Source Documents)
- **Core Question:** Should the POS automatically deduct raw ingredient inventory when an order is placed?
- **Source Document Evidence:**
  - `PRD.txt` Section 12 explicitly states: *"Keep inventory optional for the initial MVP."*
  - `PRD.txt` Section 19 explicitly confirms inventory is basic manual stock management.
  - Neither `PRD.txt` nor the approved frontend prototype defines recipes, Bills of Materials (BOM), or ingredient-to-menu-item consumption ratios.
- **Settled Architecture in V10.2.2:** **Defer Automatic Recipe Deduction to V2.** 
  - MVP implements robust manual inventory management: stock movements (restock purchases, wastage write-offs, manual physical count adjustments with explicit `'increase' | 'decrease'` directions), partial unique index idempotency, atomic decrement/increment, low-stock threshold alerts, and inventory valuation reports.
  - Recipe-based automatic deduction (BOM) is explicitly architected and scheduled for Version 2.0 once ingredient prep standards and kitchen wastage ratios are standardized.
- **Consequences:** 100% compliant with PRD and approved frontend; eliminates kitchen estimation disputes and complex unit conversions during MVP rollout.
- **Decision Owner:** Product Manager.
- **Blocking Status:** **Decided / Unblocked for Development.**

---

## 2. Non-Blocking Development Decisions

---

### DEC-01: Default Merchant Tax Policy & GST Configuration

- **Decision ID:** `DEC-01`
- **Category:** Technical / Financial
- **Core Question:** What should be the default tax status and tax calculation mode for newly provisioned stalls?
- **Context:** In India, food stalls and QSRs with an annual turnover below ₹20 Lakhs (or ₹40 Lakhs for goods in certain states) are legally exempt from GST registration. Registered food service establishments typically operate at 5% GST without Input Tax Credit (ITC). Software must not declare legal tax exemption on behalf of merchants or collect unremitted tax.
- **Available Options:**
  1. **Option A: Tax-Disabled by Default (Recommended).** Default `taxStatus: 'disabled'`, `defaultTaxRatePercent: 0.0`. Merchants explicitly enable GST and input their GSTIN in Stall Settings if registered.
  2. **Option B: Tax-Inclusive 5% GST by Default.** Menu prices are assumed to include 5% GST unless toggled off.
  3. **Option C: Tax-Exclusive 5% GST by Default.** 5% GST is calculated and added on top of the cart subtotal at checkout.
- **Consequences:**
  - *Option A:* Legally safe; avoids imposing unauthorized tax collections on unregistered micro-vendors; fully configurable per stall in Stall Settings.
  - *Option B / C:* Imposes tax accounting on unregistered stalls; requires merchants to configure exemptions manually.
- **Recommended Option:** **Option A (Tax-Disabled by default with explicit merchant opt-in)**.
- **Decision Owner:** Finance Lead & Tax Compliance Auditor.
- **Blocking Status:** **Non-Blocking for Development.** (The Mongoose schema supports all three modes; defaults can be updated anytime in configuration without schema migration).

---

### DEC-06: Production Domain & Ingress Routing Strategy

- **Decision ID:** `DEC-06`
- **Category:** Technical / Ingress
- **Core Question:** How should production HTTP traffic be routed between the React frontend and the Express backend?
- **Available Options:**
  1. **Option A: Single Domain with Path Routing (e.g., `fooddesk.com` and `fooddesk.com/api`) (Recommended).** Nginx reverse proxy routes `/api` to Express and `/` to React build assets.
  2. **Option B: Subdomain Architecture (e.g., `app.fooddesk.com` for frontend and `api.fooddesk.com` for backend).** Independent DNS records; requires CORS credentials allowlist and cross-subdomain cookie scoping.
- **Consequences:**
  - *Option A:* Eliminates CORS complexity; simplifies SSL certificates; enables `sameSite: 'lax'` cookies without domain overrides.
  - *Option B:* Allows deploying frontend and backend to completely separate cloud hosts; requires CORS management and complex cookie domain scoping.
- **Recommended Option:** **Option A (Single Domain with `/api` Path Routing via Nginx)**.
- **Decision Owner:** DevOps Lead & Systems Architect.
- **Blocking Status:** **Non-Blocking for Development.** (Local development uses Vite proxy or localhost ports; decision required before Phase 6 staging deployment).

---

## 3. Production-Blocking External Dependencies

---

### DEC-03: Production Payment Gateway Selection & Live Onboarding

- **Decision ID:** `DEC-03`
- **Category:** Production-Provider
- **Core Question:** Which commercial payment gateway provider should be selected for production dynamic UPI QR generation and automated webhooks?
- **Context:** Dynamic UPI QR codes require an Indian payment aggregator with NPCI/RBI merchant approval.
- **Available Options:**
  1. **Option A: Razorpay (Recommended).** Industry-standard Node.js SDK, mature dynamic UPI QR APIs, robust webhook HMAC verification, and comprehensive test dashboard.
  2. **Option B: PhonePe Payment Gateway.** Competitive UPI success rates; requires custom REST webhook integration.
  3. **Option C: Cashfree Payments.** Reliable auto-collect UPI QR; requires separate merchant onboarding.
- **Consequences:**
  - *Option A:* Documented in `PRD.txt` Section 1 and `IMPLEMENTATION_PLAN.md`; fastest integration path.
  - All options require business KYC, merchant bank account linking, and API credentials.
- **Recommended Option:** **Option A (Razorpay)**.
- **Decision Owner:** Finance Lead & Commercial Operations.
- **Blocking Status:** **Production-Blocking.** (Development across Phases 1–5 is completely unblocked because the backend provides a full Local Mock Payment Adapter; live gateway KYC is required only before public production launch in Phase 6).
- **Architecture Invariants (DEF-50, DEF-56, DEF-57 & DEF-58):**
  - **Explicit Provider Required & Schema Default Removal (DEF-56):** For all non-cash payment requests, an explicitly supplied, non-empty, recognized and configured provider in `GATEWAY_PROVIDER_REGISTRY` (e.g., `'razorpay'` or `'mock'`) is mandatory. Implicit defaulting to Razorpay is strictly prohibited across all layers: the service signature specifies `gatewayProvider = null` and the Mongoose schema specifies `gatewayProvider: { type: String, default: null }`, preventing Mongoose from populating Razorpay prior to validation. Missing, empty, or whitespace-only providers are rejected immediately with HTTP 400 `ValidationError` before database session start, request fingerprinting, or any database mutation.
  - **Dual-Layer Validation Architecture & Schema Consistency (DEF-50 & DEF-57):** Both Layer 1 (Service-Level Ingress Validation in `settleOrderPayment()` Step 1) and Layer 2 (Schema-Level Persistence Validation in `PaymentTransactionSchema.pre('validate')`) dynamically enforce all `mandatoryIdentifiers` declared for that provider in `GATEWAY_PROVIDER_REGISTRY`. Unconfigured providers and missing mandatory identifiers fail validation before database persistence.
  - **Cash Invariant:** Cash payments strictly bypass gateway checks and normalize all gateway fields to `null`.
  - **Production Registry & Test Fixture Boundary (DEF-58):** The documented production `GATEWAY_PROVIDER_REGISTRY` contains strictly **`razorpay`** and **`mock`**. The test-only fixture `test_gateway` used in `TS-PAY-14` is temporarily registered on the shared mutable registry within an isolated serial test harness (`describe.sequential`), verified across both service-level and direct schema-level rejection when mandatory identifiers are omitted, and removed in a guaranteed `try/finally` cleanup step (`delete GATEWAY_PROVIDER_REGISTRY['test_gateway']`), ensuring the production registry remains strictly unpolluted.

---

### DEC-04: Production Transactional SMS Gateway Provider

- **Decision ID:** `DEC-04`
- **Category:** Production-Provider
- **Core Question:** Which SMS gateway provider should be selected for production digital receipt delivery?
- **Context:** Indian telecom regulations (TRAI/DLT) require principal entity registration, sender ID approval, and registered message templates before transactional SMS can be delivered.
- **Available Options:**
  1. **Option A: MSG91 (Recommended).** Specified in `PRD.txt` Section 1; robust DLT template routing, transactional SMS APIs, and WhatsApp Business API integration options.
  2. **Option B: Fast2SMS / Textlocal.** Alternative Indian SMS providers with varying DLT support.
  3. **Option C: Twilio.** Global provider; higher cost for Indian domestic SMS; requires DLT setup.
- **Consequences:**
  - *Option A:* Matches PRD requirements; provides reliable Indian delivery.
  - Requires TRAI DLT registration and approved template IDs before live delivery.
- **Recommended Option:** **Option A (MSG91)**.
- **Decision Owner:** Operations Lead & Compliance.
- **Blocking Status:** **Production-Blocking.** (Development across Phases 1–5 is completely unblocked because the backend provides a full Local Mock Logger Adapter; live DLT credentials are required only before public launch in Phase 6).

---

### DEC-05: Production Server Hosting Infrastructure & Cloud Strategy

- **Decision ID:** `DEC-05`
- **Category:** Production-Provider
- **Core Question:** Where should the production Node.js Express backend and MongoDB database be hosted?
- **Available Options:**
  1. **Option A: Managed PaaS (Railway / Render / Fly.io) + MongoDB Atlas.** Fastest deployment, zero server maintenance, automated SSL/TLS, and managed container scaling.
  2. **Option B: Virtual Private Server (DigitalOcean Droplet / Linode) + MongoDB Atlas M10 (Recommended).** Fixed monthly cost ($12–$24/month), full root control, Nginx reverse proxy, PM2 cluster mode, and automated Let's Encrypt SSL.
  3. **Option C: Enterprise Cloud (AWS ECS / Fargate + AWS DocumentDB / Atlas).** High availability, multi-region failover; highest operational complexity and cost.
- **Consequences:**
  - *Option A:* Simplest for rapid staging; higher scaling costs later.
  - *Option B:* Optimal balance of low cost, predictable billing, and production control for QSR deployments.
  - *Option C:* Over-engineered for an initial MVP.
- **Recommended Option:** **Option B (DigitalOcean VPS + MongoDB Atlas M10 Replica Set)**.
- **Decision Owner:** Lead Architect & IT Operations.
- **Blocking Status:** **Non-Blocking for Development.** (Development executes locally using Node.js and a local MongoDB replica set; hosting infrastructure is required only during Phase 6 staging).

---

## 4. Summary of Decision Impact on Implementation Gates (DEF-34 Alignment)

| Gate / Phase | Implementation Readiness Status | Controlling Dependencies & Architectural Notes |
| :--- | :--- | :--- |
| **Gate 1: Local Development (Phases 1–5)** | **UNCONDITIONALLY READY / UNBLOCKED** | All 19 schemas, 20 modules, routes, and business algorithms fully specified. Pluggable tenancy layer resolves DEC-00. DEC-01 tax defaults configurable. Local mock payment and SMS adapters permit complete offline development without third-party credentials. |
| **Gate 2: Automated Testing (Phases 1–5)** | **UNCONDITIONALLY READY / UNBLOCKED** | Test specifications, contract tests, and concurrency simulation harnesses fully specified. Zero reliance on live external gateways. (Pending developer test suite execution). |
| **Gate 3: Staging Deployment (Phase 6 Early)** | **READY AFTER INFRASTRUCTURE DECISIONS** | Non-blocking for development. Requires provisioning of cloud host (DEC-05: DigitalOcean VPS / Managed PaaS) and ingress routing/TLS (DEC-06: Single domain `/api` path routing). Test API keys used for integration verification. |
| **Gate 4: Production Go-Live (Phase 6 Final)** | **CONDITIONALLY BLOCKED (COMMERCIAL ONBOARDING)** | Production-blocking external commercial dependencies. Software implementation unblocked, but public customer launch cannot proceed without: <br>• **DEC-03:** Live Razorpay merchant KYC & bank verification. <br>• **DEC-04:** Live MSG91 TRAI DLT principal registration & template approval. |

---

### Detailed Implementation Phase Readiness Breakdown

```
┌──────────────────────────────┬────────────────────────┬────────────────────────────────┐
│                              IMPLEMENTATION GATE STATUS                                │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Implementation Phase         │ Gate Status            │ Blocking Dependencies / Notes  │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 1: Core Foundation & DB│ READY FOR              │ UNBLOCKED. (DEC-00 handled via │
│                              │ IMPLEMENTATION         │ Pluggable Tenancy Layer; DEC-01│
│                              │                        │ defaults configurable).        │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 2: Menu, Orders, POS   │ READY FOR              │ UNBLOCKED.                     │
│                              │ IMPLEMENTATION         │                                │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 3: Payments & KDS      │ READY FOR              │ UNBLOCKED for Development.     │
│                              │ IMPLEMENTATION         │ (Uses Local Mock Adapter).     │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 4: Inventory & P&L     │ READY FOR              │ UNBLOCKED. (DEC-02 resolved per│
│                              │ IMPLEMENTATION         │ PRD §12).                      │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 5: Super Admin & Ops   │ READY FOR              │ UNBLOCKED.                     │
│                              │ IMPLEMENTATION         │                                │
├──────────────────────────────┼────────────────────────┼────────────────────────────────┤
│ Phase 6: Production Staging  │ READY AFTER SPECIFIED  │ Production-blocking. Requires: │
│ & Provider Onboarding        │ DECISIONS              │ - DEC-03: Razorpay KYC approval│
│                              │                        │ - DEC-04: MSG91 TRAI DLT apprv │
│                              │                        │ - DEC-05: Cloud host provision │
│                              │                        │ - DEC-06: Domain & TLS setup   │
└──────────────────────────────┴────────────────────────┴────────────────────────────────┘
```

---
*End of FoodDesk Consolidated Backend Decision Register (Version 10.2.2 — Architecture Freeze).*
