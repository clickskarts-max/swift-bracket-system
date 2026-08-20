# Security Implementation Plan — Strict User-Level Data Isolation

We will enforce multi-tenant isolation using Supabase Row Level Security (RLS). This ensures that users can only interact with data they own, preventing unauthorized cross-user access via UI manipulation or direct API calls.

## Database Security (Supabase)

### 1. Ownership Enforcement
Create a new migration to standardize ownership across all user-facing tables.
- Table: `organizations`, `tournaments`, `teams`, `players`, `matches`, `sponsors`.
- Constraint: Ensure `owner_id` is non-nullable where possible and references `auth.users(id)`.
- Default: Use `auth.uid()` for `owner_id` in `INSERT` operations via RLS or database defaults.

### 2. RLS Policy Audit & Hardening
Replace permissive policies with strict ownership-based checks.
- **SELECT**: `owner_id = auth.uid()` for all private data.
- **INSERT**: `WITH CHECK (owner_id = auth.uid())`.
- **UPDATE/DELETE**: `USING (owner_id = auth.uid())`.
- **Public Data**: Refine `public read` policies to only allow access when `tournaments.is_public` is true, ensuring non-public tournaments remain invisible to others even with a direct ID.
- **Storage**: Apply RLS to the `media` bucket to restrict file access/management to the uploader.

### 3. Dangerous Policy Removal
Identify and drop any `USING (true)` or `FOR ALL TO authenticated` policies that bypass ownership.

## Application Logic

### 1. Frontend Hardening
- Audit `useUpsert` in `src/lib/queries.ts` to ensure `owner_id` is always passed and matches the session.
- Verify that manual ID manipulation in URLs (e.g., `/tournament/:id`) correctly triggers 404/403 errors when the authenticated user does not own the resource.

## Verification Plan

### Automated Security Tests
Create a Playwright script `security_test.py` to:
1. Log in as **User A**, create a tournament, and note its ID.
2. Log in as **User B** and attempt to:
   - GET the tournament details.
   - INSERT a team into User A's tournament.
   - UPDATE User A's tournament name.
   - DELETE User A's tournament.
3. Assert that all unauthorized attempts from User B result in `403 Forbidden` or empty results.

### Manual Verification
- Review the "View Backend" panel to confirm RLS is active and policies are applied to all sensitive tables.
