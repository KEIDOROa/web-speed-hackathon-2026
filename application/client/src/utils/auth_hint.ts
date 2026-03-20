const AUTH_HINT_COOKIE = "cax_authed";

export function clearAuthHintOnClient(): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure = globalThis.location?.protocol === "https:";
  document.cookie = `${AUTH_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
}
