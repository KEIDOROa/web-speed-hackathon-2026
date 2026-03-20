type BootstrapMePayload = { status: "pending" } | { status: "guest" } | { status: "ok"; user: Models.User };

const CACHED_USER_KEY = "cax_cached_user";

export function getCachedUser(): Models.User | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as Models.User;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCachedUser(user: Models.User): void {
  try {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearCachedUser(): void {
  try {
    localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    // ignore
  }
}

export function initialAuthFromBootstrap(): {
  activeUser: Models.User | null;
  authReady: boolean;
} {
  if (typeof window === "undefined") {
    return { activeUser: null, authReady: false };
  }
  const raw = (window as unknown as { __BOOTSTRAP_ME__?: BootstrapMePayload }).__BOOTSTRAP_ME__;
  if (raw?.status === "ok") {
    setCachedUser(raw.user);
    return { activeUser: raw.user, authReady: true };
  }
  if (raw?.status === "guest") {
    return { activeUser: null, authReady: true };
  }
  // pending: use cached user for instant render
  const cached = getCachedUser();
  if (cached) {
    return { activeUser: cached, authReady: true };
  }
  return { activeUser: null, authReady: false };
}
