export type ProgressEvent = {
  stage: string;
  message: string;
};

/**
 * POSTs a JSON body and reads a Server-Sent Events response, forwarding
 * `progress` events and resolving with the `result` payload.
 * EventSource can't be used because it only supports GET.
 */
export async function postSseStream<T>(
  url: string,
  body: unknown,
  onProgress?: (event: ProgressEvent) => void
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    // Errors before the stream opens come back as regular JSON.
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
      else if (Array.isArray(payload?.errors)) message = payload.errors.join(', ');
    } catch { /* non-JSON body — keep the status message */ }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        if (!block.trim() || block.startsWith(':')) continue; // skip heartbeats

        const lines = block.split('\n');
        const eventLine = lines.find(l => l.startsWith('event: '));
        const dataLine = lines.find(l => l.startsWith('data: '));
        if (!dataLine) continue;

        const eventType = eventLine ? eventLine.slice(7).trim() : 'message';
        const data = JSON.parse(dataLine.slice(6));

        if (eventType === 'progress') {
          onProgress?.(data as ProgressEvent);
        } else if (eventType === 'result') {
          return data as T;
        } else if (eventType === 'error') {
          throw new Error(data.message ?? 'Request failed');
        }
      }
    }
  } finally {
    reader.cancel().catch(() => { /* already closed */ });
  }

  throw new Error('Stream ended without a result event');
}
