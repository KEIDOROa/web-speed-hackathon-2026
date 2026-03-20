type BootstrapMePayload = { status: "pending" } | { status: "guest" } | { status: "ok"; user: Models.User };

export function initialAuthFromBootstrap(): {
  activeUser: Models.User | null;
  authReady: boolean;
} {
  if (typeof window === "undefined") {
    return { activeUser: null, authReady: false };
  }
  const raw = (window as unknown as { __BOOTSTRAP_ME__?: BootstrapMePayload }).__BOOTSTRAP_ME__;
  if (raw?.status === "ok") {
    return { activeUser: raw.user, authReady: true };
  }
  if (raw?.status === "guest") {
    return { activeUser: null, authReady: true };
  }
  return { activeUser: null, authReady: false };
}
