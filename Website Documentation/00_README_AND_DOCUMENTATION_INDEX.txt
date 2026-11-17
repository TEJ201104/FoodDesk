================================================================================
FOODDESK — COMPREHENSIVE WEBSITE DOCUMENTATION & OPERATIONAL REFERENCE MANUAL
================================================================================
Document File: 00_README_AND_DOCUMENTATION_INDEX.txt
Location:      D:\Projects\FoodDesk\Website Documentation\
Version:       1.0.0 (Release Candidate Demonstration Build)
Applicability: FoodDesk Multi-Tenant POS & Stall Operations Platform
Audit State:   100% Codebase-Verified • Non-Destructive Audit Mode
================================================================================

1. WELCOME TO THE FOODDESK DOCUMENTATION REPOSITORY
--------------------------------------------------------------------------------
Welcome to the official, authoritative documentation repository for FoodDesk ("Manage Smart. Serve Fast.").

This documentation package has been prepared specifically to serve as a comprehensive user manual, functional verification record, operational guide, and technical reference for the entire FoodDesk application.

Whether you are a food stall owner operating a high-volume walk-in counter, a kitchen chef managing live food preparation queues, a platform super-administrator overseeing multi-stall tenancy and compliance, a prospective customer browsing a stall's public digital menu, or an auditor verifying system integrity, this repository provides complete, step-by-step documentation for every screen, button, field, modal, calculation, workflow, and data relationship in the application.

Every document in this suite is written with the assumption that the reader may have never seen FoodDesk before, possesses zero prior knowledge of commercial Point of Sale (POS) systems, and requires clear, unambiguous, plain-English explanations supported by exact technical and operational facts.


2. CORE PHILOSOPHY & AUTHORING STANDARDS
--------------------------------------------------------------------------------
Every document across all nine subdirectories adheres strictly to the following standards:

1. ACTUAL CODEBASE FIDELITY:
   Nothing in this manual is based on assumptions, guesswork, or generic POS templates. Every page layout, element name, field label, calculation formula, keyboard interaction, audio chime, and state transition documented here corresponds exactly to the verified frontend implementation located in D:\Projects\FoodDesk\frontend\src\.

2. MANDATORY 12-SECTION STRUCTURE:
   Every feature and module document follows an exhaustive twelve-section structure covering:
   - Section 1:  Feature Overview
   - Section 2:  How to Access
   - Section 3:  Screen Layout
   - Section 4:  Detailed Element-by-Element Explanation (Location, Purpose, Calculation, Interactivity)
   - Section 5:  Available Actions
   - Section 6:  Step-by-Step Usage Guide
   - Section 7:  System Behaviour (State changes, storage events, audio alerts)
   - Section 8:  Expected Results
   - Section 9:  Related Modules & Cross-Module Dependencies
   - Section 10: Restrictions and Important Notes
   - Section 11: Frequently Asked Questions (FAQ)
   - Section 12: Verification Status (Authoritative status badge)

3. EXTREME LEVEL OF DETAIL:
   No element is skipped. Form fields, dropdown menus, table headers, action buttons, quick presets, modal dialogues, validation error messages, toast notifications, audio triggers, and currency formatting rules are cataloged in full detail.


3. COMPLETE DOCUMENTATION CATALOG & INDEX
--------------------------------------------------------------------------------

ROOT DIRECTORY OVERVIEWS:
--------------------------------------------------------------------------------
- 00_README_AND_DOCUMENTATION_INDEX.txt
  (This file) Master table of contents, directory roadmap, reading pathways, and documentation conventions.

- 01_PRODUCT_OVERVIEW.txt
  High-level product vision, core business problems solved (replacing paper notebooks and manual ledgers), architectural principles, local-first browser storage architecture, and key operational advantages.

- 02_ROLES_AND_ACCESS_GUIDE.txt
  Complete identity and permissions matrix covering Super Admin, Multi-Stall Owner (Owner 1), Single-Stall Owner (Owner 2), and Public Customers. Explains credentials, session tokens, and route guards.


FOLDER 01: AUTHENTICATION & ACCESS CONTROL (01_AUTHENTICATION/)
--------------------------------------------------------------------------------
- Login_and_Authentication.txt
  Comprehensive manual for the Dual-Mode Login Gate. Covers Stall Owner 3-credential verification (Email + Password + Stall ID) vs. Super Admin 2-credential verification, 1-click demonstration autofill cards, input validation, and error states.

- Role_Access_and_Navigation.txt
  In-depth guide to FoodDesk routing guards (AuthGuard, RoleGuard, PublicAuthRoute, StallGuard), route redirection rules, top navigation bar components, active stall badges, multi-stall switcher dropdowns, and sidebar drawer navigation.

- Logout_and_Session_Behaviour.txt
  Detailed explanation of user session lifecycle, localStorage token persistence, cross-tab synchronization, safe logout handling, session rehydration, and client-side tamper detection.


FOLDER 02: STALL OWNER OPERATIONAL WORKSTATIONS (02_STALL_OWNER/)
--------------------------------------------------------------------------------
- 01_Dashboard.txt
  Stall operations cockpit: hero banner, quick workstation launch buttons, real-time KPI metrics (Gross Sales Today, Orders All-Time, Payment Rate, Net Profit Today), and isolation confirmation.

- 02_POS_New_Order.txt
  High-speed walk-in counter workstation: live search, dynamic category pills, food catalog cards, sold-out guards, cart sidebar, percentage and flat discounts, customer details, payment methods, order review modal, pickup token issuance, and receipt modal.

- 03_Order_Management.txt
  Complete counter order ledger: multi-criteria search, date presets, kitchen stage filters, payment status filters, slide-over order details drawer, audit trail, simulated refunds, order cancellations, and reprintable thermal receipts.

- 04_Kitchen_Display_System.txt
  4-column real-time Kanban board for kitchen staff: Received, Preparing, Ready for Pickup, and Completed columns. Live elapsed timers, delay color coding, 1-click status transitions, audio bell chimes, and fullscreen mode.

- 05_Menu_Management.txt
  Menu catalog and pricing administration: grid vs. table views, category manager modal, item creation and editing, real-time profit and margin calculator, 1-click stock availability toggle, and non-destructive soft archiving.

- 06_Inventory_Management.txt
  Raw materials and ingredient tracking: active inventory table, units of measure, minimum threshold reorder alerts, dynamic low-stock warning banners, stock adjustments (add/reduce), wastage logging modal, and complete movement logs.

- 07_Expense_Management.txt
  Operational expenditure ledger: predefined cost categories, date range filters, category breakdown bar chart, add/edit expense modal, delete confirmation with mandatory reason, and versioned audit history.

- 08_Financial_Analytics.txt
  Deep financial P&L reporting: 6-card KPI grid (Gross Sales, Net Revenue, COGS, Gross Profit, Total Expenses, Net Profit), date range presets, sales trends area chart, payment method pie chart, best/least selling items bar chart, CSV export, and printable A4 report.

- 09_Support_and_Issue_Management.txt
  Internal help desk for stall operators: submitting issues to Super Admin, 5-stage ticket lifecycle (Submitted, Under Review, In Progress, Resolved, Reopened), threaded messaging drawer, official resolution notes, and reopen controls.

- 10_Profile_Settings_and_Account.txt
  Stall workspace profile: business name, ID, slug, category, physical counter address, operating hours, payment configuration (UPI VPA, Cash, Dynamic QR), and StallGuard tamper protection status.


FOLDER 03: SUPER ADMIN GOVERNANCE PORTAL (03_SUPER_ADMIN/)
--------------------------------------------------------------------------------
- 01_Platform_Dashboard.txt
  Global platform oversight: platform-wide Gross Merchandising Volume (GMV), active stalls network, registered owners, centralized ticket counts, recent stall registrations, open support requests, and chronological audit activity feed.

- 02_Stall_Management.txt
  Stall compliance and lifecycle governance: stall directory, owner mapping, approval pipeline, approving pending applications, rejecting applications with mandatory feedback, suspending stalls, and reactivating suspended stalls.

- 03_Stall_Details_and_Governance.txt
  Deep stall compliance inspection: detailed stall profile drawer, owner contact information, operational hours, payment settings, address breakdown, and governance audit history.

- 04_Support_Ticket_Management.txt
  Centralized issue resolution console: global ticket inbox, filtering by stall, category, priority, and status, interactive admin reply dispatch, status transitions, and mandatory resolution note enforcement.

- 05_Other_Admin_Features.txt
  Owner registry directory, platform system diagnostics, Web Locks API concurrency status, Asia/Kolkata timezone verification, and high-risk factory demo reset modal with typed safety confirmation ("RESET DEMO DATA").


FOLDER 04: PUBLIC CUSTOMER PORTALS (04_PUBLIC_CUSTOMER/)
--------------------------------------------------------------------------------
- 01_Public_Digital_Menu.txt
  Customer walk-in menu portal (/menu/:stallSlug): URL slug binding, stall header, category navigation pills, search bar, dietary veg/non-veg indicators, real-time sold-out badges, and strict read-only counter presentation (no cart/checkout).

- 02_Product_and_Category_Exploration.txt
  Customer menu browsing experience: food card layouts, selling price presentation, dietary badges, ingredient notes, zero-leakage security (COGS and margins stripped), and stall-isolated catalog boundaries.

- 03_Public_Order_Tracking.txt
  Live customer order tracking portal (/track/:stallSlug/:orderNumber): double-key validation (stall slug + order number), 5 canonical order milestones, real-time reactive updates from KDS, customer PII masking, and cross-stall isolation.


FOLDER 05: END-TO-END OPERATIONAL WORKFLOWS (05_END_TO_END_WORKFLOWS/)
--------------------------------------------------------------------------------
- 01_Complete_POS_Order_Workflow.txt
  Chronological end-to-end journey of an order: from customer arrival at counter, menu selection, discount application, payment collection, token issuance, KDS dispatch, to customer pickup.

- 02_Order_to_Kitchen_Workflow.txt
  Real-time communication between POS counter workstation and Kitchen Display Station: event dispatch, audio chimes, Kanban transitions, pickup notification, and final completion.

- 03_Payment_and_Receipt_Workflow.txt
  Tender processing and documentation: Cash calculator (amount tendered and change due), Dynamic UPI QR generation, Static QR payment, transaction ID recording, payment status sync, and 58mm/80mm thermal receipt printing.

- 04_Menu_and_Product_Workflow.txt
  Product lifecycle workflow: adding new food items, cost vs. price analysis, category structuring, immediate stockout toggling during counter rush, editing details, and soft archiving.

- 05_Inventory_and_Expenses_Workflow.txt
  Back-of-house cost and inventory management: manual stock receipts, periodic stock adjustments, recording ingredient wastage, logging daily operating expenses, and audit tracking.

- 06_Analytics_and_Reporting_Workflow.txt
  Business intelligence and reporting: date range selection, inspecting P&L metrics, analyzing payment distributions, evaluating best sellers, generating CSV exports, and printing executive P&L summaries.


FOLDER 06: MODULE RELATIONSHIPS & ARCHITECTURE (06_MODULE_RELATIONSHIPS/)
--------------------------------------------------------------------------------
- Module_Interaction_Overview.txt
  Architectural blueprint illustrating how all eleven FoodDesk modules connect and share data without tight coupling.

- Data_Flow_and_Information_Sharing.txt
  Detailed trace of data flows: how an action in POS propagates simultaneously to Orders, KDS, Analytics, Dashboard, and Customer Tracking via browser storage events and custom DOM dispatchers.


FOLDER 07: GLOSSARY & REFERENCE (07_GLOSSARY_AND_REFERENCE/)
--------------------------------------------------------------------------------
- FoodDesk_Glossary.txt
  Alphabetical dictionary of all FoodDesk concepts, acronyms, and terminology (e.g., COGS, GMV, KDS, Token, Slug, Web Locks, Soft Archive, StallGuard).

- Common_Terms_and_Definitions.txt
  Plain-language guide explaining commercial restaurant and POS terminology for non-technical beginners.

- Known_Limitations_and_Prototype_Behaviour.txt
  Explicit documentation of prototype characteristics: browser localStorage capacity, single-browser tab scope, simulated payment gateways, and production roadmap considerations.


FOLDER 08: ARCHITECTURAL DIAGRAMS & FLOWCHARTS (08_DIAGRAMS_AND_FLOWCHARTS/)
--------------------------------------------------------------------------------
- Website_Navigation_Flow.mmd
  Mermaid diagram mapping the entire website structure, route hierarchy, and access barriers.

- Authentication_Flow.mmd
  Mermaid sequence diagram showing dual-mode login verification, credential validation, and StallGuard initialization.

- POS_Order_Flow.mmd
  Mermaid flowchart illustrating the complete POS ordering and cart calculation logic.

- Order_to_KDS_Flow.mmd
  Mermaid sequence diagram depicting real-time order creation and kitchen stage progression.

- Module_Interaction_Flow.mmd
  Mermaid diagram showcasing data flow across POS, KDS, Inventory, Expenses, Analytics, and Governance.


FOLDER 09: VERIFICATION & COVERAGE (09_VERIFICATION_AND_COVERAGE/)
--------------------------------------------------------------------------------
- Feature_Verification_Checklist.txt
  Master verification matrix verifying every single feature against live codebase execution.

- Page_and_Route_Inventory.txt
  Complete inventory of all 18 routes in the application, including HTTP methods, URL params, guards, and access tiers.

- Undocumented_or_Unverified_Features.txt
  Formal statement confirming 100% documentation coverage with 0 undocumented features or orphan pages.


4. RECOMMENDED READING PATHWAYS
--------------------------------------------------------------------------------
Depending on your role and objectives, we recommend following these reading sequences:

PATHWAY A: FIRST-TIME STALL OWNER (START HERE)
1. 01_PRODUCT_OVERVIEW.txt
2. 02_ROLES_AND_ACCESS_GUIDE.txt
3. 01_AUTHENTICATION/Login_and_Authentication.txt
4. 02_STALL_OWNER/01_Dashboard.txt
5. 02_STALL_OWNER/02_POS_New_Order.txt
6. 02_STALL_OWNER/04_Kitchen_Display_System.txt
7. 05_END_TO_END_WORKFLOWS/01_Complete_POS_Order_Workflow.txt

PATHWAY B: SUPER ADMINISTRATOR & PLATFORM MANAGER
1. 01_PRODUCT_OVERVIEW.txt
2. 02_ROLES_AND_ACCESS_GUIDE.txt
3. 03_SUPER_ADMIN/01_Platform_Dashboard.txt
4. 03_SUPER_ADMIN/02_Stall_Management.txt
5. 03_SUPER_ADMIN/04_Support_Ticket_Management.txt
6. 03_SUPER_ADMIN/05_Other_Admin_Features.txt

PATHWAY C: ACCOUNTANT & FINANCIAL AUDITOR
1. 02_STALL_OWNER/08_Financial_Analytics.txt
2. 02_STALL_OWNER/07_Expense_Management.txt
3. 02_STALL_OWNER/03_Order_Management.txt
4. 05_END_TO_END_WORKFLOWS/06_Analytics_and_Reporting_Workflow.txt
5. 07_GLOSSARY_AND_REFERENCE/Known_Limitations_and_Prototype_Behaviour.txt

PATHWAY D: SOFTWARE QUALITY ASSURANCE & AUDIT ENGINEER
1. 09_VERIFICATION_AND_COVERAGE/Page_and_Route_Inventory.txt
2. 09_VERIFICATION_AND_COVERAGE/Feature_Verification_Checklist.txt
3. 06_MODULE_RELATIONSHIPS/Data_Flow_and_Information_Sharing.txt
4. 08_DIAGRAMS_AND_FLOWCHARTS/Website_Navigation_Flow.mmd
5. 09_VERIFICATION_AND_COVERAGE/Undocumented_or_Unverified_Features.txt

================================================================================
END OF FILE: 00_README_AND_DOCUMENTATION_INDEX.txt
================================================================================
