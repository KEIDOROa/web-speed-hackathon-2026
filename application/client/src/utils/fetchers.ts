import { gzip } from "pako";

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw response;
  return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const prefetched = (window as any).__PREFETCH__?.[url];
  if (prefetched) {
    delete (window as any).__PREFETCH__[url];
    return prefetched as Promise<T>;
  }
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = gzip(uint8Array);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: compressed,
  });
  if (!response.ok) throw response;
  return response.json() as Promise<T>;
}
