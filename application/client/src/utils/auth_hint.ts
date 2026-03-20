const AUTH_HINT_COOKIE = "cax_authed";

export function readAuthHintPresent(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === AUTH_HINT_COOKIE && value === "1";
  });
}

export function clearAuthHintOnClient(): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure = globalThis.location?.protocol === "https:";
  document.cookie = `${AUTH_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
}
