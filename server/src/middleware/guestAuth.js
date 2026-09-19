import { prisma } from "../lib/prisma.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reads the guest UUID from the `x-guest-id` header (set by the client from
 * localStorage). There is no password/session — the UUID itself *is* the
 * identity. We upsert a GuestSession row so foreign keys have something to
 * point at, and touch `lastSeenAt` for basic analytics.
 *
 * This is intentionally NOT secure auth — anyone who knows another guest's
 * UUID could impersonate them. That's an accepted trade-off of the
 * "no formal auth" requirement. Do not use this pattern for anything
 * sensitive.
 */
export async function guestIdentity(req, res, next) {
  const guestId = req.header("x-guest-id");

  if (!guestId || !UUID_RE.test(guestId)) {
    return res.status(400).json({ error: "Missing or invalid x-guest-id header" });
  }

  try {
    const guest = await prisma.guestSession.upsert({
      where: { id: guestId },
      update: { lastSeenAt: new Date() },
      create: { id: guestId },
    });
    req.guestId = guest.id;
    next();
  } catch (err) {
    next(err);
  }
}

/** Gate for the "Daily Content Entry" admin routes — simple bearer token. */
export function requireAdmin(req, res, next) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
