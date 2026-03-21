import { useEffect, useEffectEvent } from "react";

export function useWs<T>(url: string, onMessage: (event: T) => void) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    try {
      onMessage(JSON.parse(event.data as string) as T);
    } catch {
      /* 非JSONのフレームは無視 */
    }
  });

  useEffect(() => {
    if (url === "") {
      return;
    }

    let ws: WebSocket | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }
      ws = new WebSocket(url);
      ws.addEventListener("message", handleMessage);
    };

    const scheduleConnect = () => {
      queueMicrotask(connect);
    };

    scheduleConnect();

    return () => {
      cancelled = true;
      if (ws !== null) {
        ws.removeEventListener("message", handleMessage);
        ws.close();
      }
    };
  }, [url]);
}
