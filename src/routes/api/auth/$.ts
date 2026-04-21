// src/routes/api/auth/$.ts
// Catch-all server route that hands every /api/auth/* request to better-auth.
// better-auth handles its own internal routing based on request.url, so we
// just need to forward GET and POST to auth.handler() unchanged.
//
// In this version of TanStack Start, server-side HTTP handlers are defined
// using the `server.handlers` option inside createFileRoute — NOT createAPIFileRoute.

import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/src/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
