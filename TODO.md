# TODO - Auth.js integration

## Steps
1. Done: Created Auth.js route handler at `app/api/auth/[...nextauth]/route.ts`.
2. Done: Reused installed `next-auth` dependency.
3. Done: Refactored `lib/auth/index.ts` and `proxy.ts` to use Auth.js session/JWT state.
4. Done: Removed the old `salonflow_session` helper.
5. Done: Updated logout UI to call Auth.js `signOut`.
6. Done: Removed legacy login/logout API routes; register now creates the account and signs in through Auth.js on the client.
7. Done: Added forgot-password and reset-password pages and APIs.
8. Done: `npm run build` passes.

