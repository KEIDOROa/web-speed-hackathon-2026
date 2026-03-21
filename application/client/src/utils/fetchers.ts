export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok) throw response;
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const bag = (window as unknown as { __PREFETCH__?: Record<string, Promise<unknown>> }).__PREFETCH__;
  const prefetched = bag?.[url];
  if (prefetched != null && bag != null) {
    delete bag[url];
    try {
      const data = await prefetched;
      if (url === "/api/v1/me" && data === null) {
        /* ブートストラップの /api/v1/me が 401 でも、セッション確定後の再取得を試す */
      } else {
        return data as T;
      }
    } catch (err) {
      if (err instanceof Response && err.status === 401 && url === "/api/v1/me") {
        /* 同上 */
      } else if (err instanceof Response) {
        throw err;
      }
      /* index.html のプリフェッチが先に失敗した場合は通常取得へ */
    }
  }
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}
