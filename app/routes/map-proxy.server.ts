export const queue: (() => Promise<void>)[] = [];
export let processing = false;
export const FETCH_DELAY_MS = 100;
export const MAX_QUEUE_LENGTH = 100;

export async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const fn = queue.shift();
    if (fn) {
      await fn();
      await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
    }
  }
  processing = false;
}
