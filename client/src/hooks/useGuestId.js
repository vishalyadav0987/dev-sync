const KEY = "dsa_guest_id";

/** RFC4122-ish v4 UUID, no external dep needed. */
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable per-browser UUID, creating one on first visit.
 * This is the "identity" used for blog authorship, comment ownership,
 * study sessions, and notes — no login required.
 */
export function getGuestId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
