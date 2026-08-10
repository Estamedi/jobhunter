import { api } from "./client.js";

// Cached per popup session — cleared on sign-out via resetCurrentUser().
let currentUser = null;

export function isJobSeeker(user) {
  return (user?.roles || []).some((r) => r.toLowerCase() === "jobseeker");
}

export async function getCurrentUser() {
  if (!currentUser) {
    currentUser = await api("/api/Users/me");
  }
  return currentUser;
}

export function resetCurrentUser() {
  currentUser = null;
}
