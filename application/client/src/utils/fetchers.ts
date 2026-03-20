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
      return (await prefetched) as T;
    } catch {
      /* index.html の fetchWithTimeout が先に失敗した場合は通常取得へ */
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
