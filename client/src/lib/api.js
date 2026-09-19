import { getGuestId } from "../hooks/useGuestId";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const ASSET_BASE_URL = API_BASE_URL.replace("/api", "");

const BASE_URL = API_BASE_URL;
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["x-guest-id"] = getGuestId();

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Network error: Failed to connect to server. (${err.message})`);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const errorMsg = payload.error || payload.message || `Server Error: ${res.status} ${res.statusText}`;
    throw new Error(errorMsg);
  }
  if (res.status === 204) return null;
  return res.json();
}

import { io } from "socket.io-client";
export const socket = io(BASE_URL.replace("/api", ""));

socket.on("connect", () => {
  const guestId = getGuestId();
  if (guestId) {
    socket.emit("join-guest-room", guestId);
  }
});

export const api = {
  // Public reads
  getCategories: () => request("/categories"),
  getProblems: (params = {}) =>
    request(`/problems?${new URLSearchParams(params)}`),
  getProblem: (slug) => request(`/problems/${slug}`),
  
  getBlogs: (page = 1, filters = {}) => {
    const params = new URLSearchParams({ page });
    if (filters.drafts) params.append("drafts", "true");
    if (filters.authorId) params.append("authorId", filters.authorId);
    return request(`/blogs?${params.toString()}`, { auth: true });
  },
  // Extension API
  getExtensionStatus: () => request("/leetcode/extension/status", { auth: true }),

  getBlog: (slug) => request(`/blogs/${slug}`, { auth: true }),
  
  trackCopy: (slug) => request(`/problems/${slug}/track-copy`, { method: "POST" }),
  trackViz: (slug) => request(`/problems/${slug}/track-viz`, { method: "POST" }),
  getProblemNote: (slug) => request(`/problems/${slug}/note`, { auth: true }),
  saveProblemNote: (slug, content) =>
    request(`/problems/${slug}/note`, {
      method: "PUT",
      body: { content },
      auth: true,
    }),

  // Guest-scoped writes (auth: true attaches x-guest-id)
  getGuestStats: () => request("/sessions/stats", { auth: true }),
  createBlog: (data) => request("/blogs", { method: "POST", body: data, auth: true }),
  updateBlog: (id, data) => request(`/blogs/${id}`, { method: "PATCH", body: data, auth: true }),
  deleteBlog: (id) => request(`/blogs/${id}`, { method: "DELETE", auth: true }),
  addComment: (blogId, body) =>
    request(`/blogs/${blogId}/comments`, { method: "POST", body: { body }, auth: true }),
  likeBlog: (blogId) => request(`/blogs/${blogId}/like`, { method: "POST", auth: true }),
  unlikeBlog: (blogId) => request(`/blogs/${blogId}/like`, { method: "DELETE", auth: true }),

  // Saves (Bookmarks)
  saveBlog: (id) => request(`/blogs/${id}/save`, { method: "POST", auth: true }),
  unsaveBlog: (id) => request(`/blogs/${id}/save`, { method: "DELETE", auth: true }),
  getSavedBlogs: () => request("/blogs/saved/list", { auth: true }),

  // Study Sessions — command center
  getSessions: (status) => request(`/sessions${status ? `?status=${status}` : ""}`, { auth: true }),
  createSession: (data) =>
    request("/sessions", { method: "POST", body: typeof data === "string" ? { title: data } : data, auth: true }),
  getSession: (id) => request(`/sessions/${id}`, { auth: true }),
  updateSession: (id, updates) => request(`/sessions/${id}`, { method: "PATCH", body: updates, auth: true }),
  archiveSession: (id) => request(`/sessions/${id}`, { method: "DELETE", auth: true }),
  deleteSessionForever: (id) => request(`/sessions/${id}?permanent=true`, { method: "DELETE", auth: true }),
  restoreSession: (id) => request(`/sessions/${id}/restore`, { method: "POST", auth: true }),
  duplicateSession: (id, opts) => request(`/sessions/${id}/duplicate`, { method: "POST", body: opts, auth: true }),
  getSessionNotes: (id, tag) => request(`/sessions/${id}/notes${tag ? `?tag=${tag}` : ""}`, { auth: true }),

  addSessionProblems: (id, problemIds) =>
    request(`/sessions/${id}/problems`, { method: "POST", body: { problemIds }, auth: true }),
  updateSessionProblem: (id, problemId, updates) =>
    request(`/sessions/${id}/problems/${problemId}`, { method: "PATCH", body: updates, auth: true }),
  removeSessionProblem: (id, problemId) =>
    request(`/sessions/${id}/problems/${problemId}`, { method: "DELETE", auth: true }),
  reorderSessionProblems: (id, order) =>
    request(`/sessions/${id}/problems-reorder`, { method: "PATCH", body: { order }, auth: true }),

  // Session lifecycle
  startSession: (id) => request(`/sessions/${id}/start`, { method: "POST", auth: true }),
  pauseSession: (id) => request(`/sessions/${id}/pause`, { method: "POST", auth: true }),
  resumeSession: (id) => request(`/sessions/${id}/resume`, { method: "POST", auth: true }),
  completeSession: (id, data) => request(`/sessions/${id}/complete`, { method: "POST", body: data, auth: true }),

  // Problem solving lifecycle (workspace actions)
  startSessionProblem: (id, problemId) =>
    request(`/sessions/${id}/problems/${problemId}/start`, { method: "POST", auth: true }),
  setSessionProblemStage: (id, problemId, stage) =>
    request(`/sessions/${id}/problems/${problemId}/stage`, { method: "PATCH", body: { stage }, auth: true }),
  solveSessionProblem: (id, problemId, data) =>
    request(`/sessions/${id}/problems/${problemId}/solve`, { method: "POST", body: data, auth: true }),
  failSessionProblem: (id, problemId) =>
    request(`/sessions/${id}/problems/${problemId}/fail`, { method: "POST", auth: true }),
  skipSessionProblem: (id, problemId) =>
    request(`/sessions/${id}/problems/${problemId}/skip`, { method: "POST", auth: true }),

  // Mistake review
  getSessionMistakes: (id) => request(`/sessions/${id}/mistakes`, { auth: true }),
  createMistake: (id, data) => request(`/sessions/${id}/mistakes`, { method: "POST", body: data, auth: true }),
  updateMistake: (id, mistakeId, updates) =>
    request(`/sessions/${id}/mistakes/${mistakeId}`, { method: "PATCH", body: updates, auth: true }),

  // Analytics / insights
  getSessionAnalytics: (id) => request(`/sessions/${id}/analytics`, { auth: true }),
  getSessionInsights: () => request(`/sessions/insights`, { auth: true }),

  saveNote: (data) => request("/notes", { method: "POST", body: data, auth: true }),
  updateNote: (id, updates) =>
    request(`/notes/${id}`, { method: "PATCH", body: updates, auth: true }),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE", auth: true }),

  // Bookmarks
  getBookmarks: (problemId) => request(`/visualizations/${problemId}/bookmarks`, { auth: true }),
  addBookmark: (problemId, data) => request(`/visualizations/${problemId}/bookmarks`, { method: "POST", body: data, auth: true }),
  removeBookmark: (problemId, stepId) => request(`/visualizations/${problemId}/bookmarks/${stepId}`, { method: "DELETE", auth: true }),
  
  // Visualizations & Notes
  getVisualization: (problemId) => request(`/visualizations/${problemId}`, { auth: true }),
  getVisualizationHistory: (problemId) => request(`/visualizations/${problemId}/history`, { auth: true }),
  saveVisualizationHistory: (problemId, data) => request(`/visualizations/${problemId}/history`, { method: "POST", body: data, auth: true }),
  getNotes: (problemId) => request(`/notes/${problemId}`, { auth: true }),

  // Gemini AI Analysis
  analyzeProblem: (slug, customInput) => request(`/problems/${slug}/analyze`, { method: "POST", body: { customInput }, auth: true }),

  // LeetCode Sync
  getLeetCodeSyncStatus: () => request(`/leetcode/sync/status`, { auth: true }),
  syncLeetCode: (leetcodeSession) => request(`/leetcode/sync`, { method: "POST", body: { leetcodeSession }, auth: true }),

  // Chat Media
  uploadChatMedia: (base64) => request(`/chat/media/upload`, { method: "POST", body: { image: base64 } }),
  searchChatGifs: (query) => request(`/chat/media/gifs?q=${encodeURIComponent(query)}`),
  reportChatMessage: (messageId, reporterId, reason) => request(`/chat/messages/${messageId}/report`, { method: "POST", body: { reporterId, reason } }),

  // Battle
  getWaitingBattles: () => request(`/battles/waiting`),
  getBattleProblems: (params = {}) => request(`/battles/problems?${new URLSearchParams(params)}`),
  createBattle: (data) => request(`/battles`, { method: "POST", body: data }),
  getBattle: (roomId) => request(`/battles/${roomId}`),
  runBattleCode: (data) => request(`/battles/run`, { method: "POST", body: data }),
  submitBattleCode: (data) => request(`/battles/submit`, { method: "POST", body: data }),
  getBattleLeaderboard: () => request(`/battles/leaderboard`),
  getUserBattleStats: (guestId) => request(`/battles/user/${guestId}`),
};

