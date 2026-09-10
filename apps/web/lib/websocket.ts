/**
 * WebSocket client for animated meiotic progression and real-time novelty events.
 */

export interface SimulationEvent {
  event: string;
  experiment_id: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export function subscribeExperimentEvents(
  experimentId: string,
  onEvent: (event: SimulationEvent) => void,
  onError?: (err: Event | Error) => void
): () => void {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
  const url = `${wsUrl}/experiments/${experimentId}`;

  let ws: WebSocket | null = null;
  let isClosed = false;

  try {
    ws = new WebSocket(url);

    ws.onmessage = (message) => {
      try {
        const payload: SimulationEvent = JSON.parse(message.data);
        onEvent(payload);
      } catch (e) {
        console.error("Failed to parse websocket message:", e);
      }
    };

    ws.onerror = (err) => {
      if (onError && !isClosed) onError(err);
    };

    ws.onclose = () => {
      // Clean disconnect
    };
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error("Unable to open WebSocket"));
  }

  return () => {
    isClosed = true;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
