# Fix Hostinger CSRF startup crash

## Goal
Restore the production server startup without weakening same-origin protection for server actions.

## Changes
- Align all TanStack framework packages to one compatible release so runtime exports match the compiled server code.
- Keep the existing CSRF middleware and authentication/error middleware wiring intact.
- Verify the installed export, dependency tree, and production output before redeployment.

## Technical details
The project currently mixes TanStack releases (`react-start` 1.168, router 1.170, and internal Start packages spanning 1.167–1.170). The deployed bundle imports `createCsrfMiddleware`, but the resolved runtime module does not expose a callable version. Pinning the public TanStack packages to the same release removes the incompatible internal package graph that causes the Hostinger crash.
