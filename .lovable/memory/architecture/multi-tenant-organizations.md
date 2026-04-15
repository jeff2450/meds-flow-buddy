---
name: Multi-Tenant Organizations
description: All tables scoped by organization_id with org-aware RLS policies
type: feature
---
- organizations table with id, name, slug, settings (jsonb)
- All core tables have organization_id FK to organizations
- get_user_org_id() SECURITY DEFINER function returns user's org from profiles
- All RLS policies combine role check + org match
- handle_new_user trigger sets org from signup metadata or defaults to seed org
- Default org: 00000000-0000-0000-0000-000000000001 (Default Pharmacy)
