# Project Memory

## Core
- Offline-first PWA: IndexedDB save queue with background Supabase sync.
- Zod for all form validation.
- RBAC: admin, manager, pharmacist, worker, staff. Admins can edit/delete. Workers are record-only.
- All currency in TZS (Tanzanian Shillings) with localized separators. Never USD.
- UI Localization: English/Kiswahili toggle using LanguageProvider.
- No `folio_number` for inventory batches. Identify by name + entry date.
- Multi-tenant: All tables have organization_id. RLS scoped by org + role.

## Memories
- [PWA Support](mem://features/pwa-offline-support) — PWA manifest and service worker config
- [Auto Worker Role](mem://auth/automatic-worker-role-assignment) — DB trigger assigns 'worker' role to new signups
- [Profile Security](mem://auth/profile-security-policies) — RLS on profiles: workers see own, admins see all
- [DB Security & Validation](mem://security/database-access-and-validation) — RLS constraints and DB-level CHECKs (no negative quantities)
- [Sales History Visibility](mem://features/sales-history-visibility) — Sales table defaults to all history, not just today
- [Batch Identification](mem://architecture/inventory-identification-model) — Constraint: no folio_number, use name + entry date
- [Analytics Schema](mem://technical-decisions/extended-schema-for-analytics-and-audit) — DB schema extensions for analytics and auditing
- [Offline Auth](mem://auth/offline-authentication-caching) — Offline IndexedDB PBKDF2 auth caching, signup disabled offline
- [Login Role Flow](mem://auth/role-selection-login-flow) — Login UI has Staff/Admin role selector
- [Offline Sync](mem://technical-decisions/unified-offline-first-sync-behavior) — Unified save-and-sync IndexedDB queue (online instant, offline polling)
- [Seed Admin](mem://auth/initial-admin-seed-account) — Seed admin credentials for testing/setup
- [Attendance Tracking](mem://features/staff-attendance-tracking) — Staff clock in/out, Admin management tab
- [Dashboard Layout](mem://style/dashboard-sidebar-layout) — Sidebar nav, stat cards layout, responsive to role
- [Stock Selection](mem://business-rules/available-stock-selection-logic) — Dropdowns show only >0 stock batches, name only, no qty
- [Monthly Report](mem://features/comprehensive-admin-monthly-report) — Report specifics and explicitly excluded sections
- [User Management](mem://auth/admin-user-management-workflow) — Admin staff registration and hard-delete via edge function
- [Localization](mem://features/localization-english-kiswahili) — LanguageProvider with English/Kiswahili toggle
- [RBAC Model](mem://auth/rbac-permissions-model) — Admins edit/delete; Workers record-only
- [Inventory Model](mem://business-rules/independent-batch-inventory-model) — Intakes create unique batches, no generic units
- [Medicine Registration](mem://features/medicine-registration-and-intake-flow) — 'Add Medicine' for new, 'Intake' for stock increase, no 'Record Outtake'
- [Batches View](mem://features/inventory-batches-view) — 'Medicine Batches' table columns and 'OUT OF STOCK' destructive badge
- [Sales Navigation](mem://features/sales-recording-navigation) — Dedicated page for sales recording, no modal dialog
- [Report Export](mem://features/report-export-behavior) — Client-side PDF generation, avoid browser print
- [TMDA Integration](mem://features/tmda-medicine-integration) — Standardized TMDA product list and categories
- [Autocomplete Search](mem://features/medicine-autocomplete-search) — Combobox search for medicine selection
- [Currency Format](mem://style/currency-format-tanzanian-shillings) — TZS currency with localized thousand separators
- [Multi-Tenant Architecture](mem://architecture/multi-tenant-organizations) — organizations table, org_id on all tables, org-scoped RLS
- [Settings Page](mem://features/settings-page) — Org name editing, role management, alert thresholds
- [Dashboard Charts](mem://features/dashboard-charts) — Recharts: daily sales trend + top selling medicines
- [Expiry Tracking](mem://features/expiry-and-batch-tracking) — expiry_date, batch_number, selling_price on medicines; expiry alerts
