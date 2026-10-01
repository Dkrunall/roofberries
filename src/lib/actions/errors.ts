// Kept out of any 'use server' module — Next.js only allows async function
// exports from Server Action files, and exporting a class breaks the
// client bundle for that module.
//
// Throw this from a Server Action for any message that's safe (and meant)
// to reach the client as-is; wrap anything else (raw DB errors, etc.) into
// one of these with a generic message before rethrowing, so internals never
// leak. See lib/actions/orders.ts for the pattern.
export class ActionError extends Error {}
