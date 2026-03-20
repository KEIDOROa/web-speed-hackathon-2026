import { useEffect, useEffectEvent } from "react";

const WS_CONNECT_AFTER_LOAD_MS = 2500;

export function useWs<T>(url: string, onMessage: (event: T) => void) {
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    onMessage(JSON.parse(event.data));
  });

  useEffect(() => {
    if (url === "") {
      return;
    }

    let ws: WebSocket | null = null;
    let cancelled = false;
    let timeoutId: number | undefined;

    const connect = () => {
      if (cancelled) {
        return;
      }
      ws = new WebSocket(url);
      ws.addEventListener("message", handleMessage);
    };

    const scheduleConnect = () => {
      timeoutId = window.setTimeout(connect, WS_CONNECT_AFTER_LOAD_MS);
    };

    if (document.readyState === "complete") {
      scheduleConnect();
    } else {
      window.addEventListener("load", scheduleConnect, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleConnect);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (ws !== null) {
        ws.removeEventListener("message", handleMessage);
        ws.close();
      }
    };
  }, [url]);
}
