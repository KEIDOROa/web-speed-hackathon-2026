export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok) throw response;
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const prefetched = (window as any).__PREFETCH__?.[url];
  if (prefetched) {
    delete (window as any).__PREFETCH__[url];
    return prefetched as Promise<T>;
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
