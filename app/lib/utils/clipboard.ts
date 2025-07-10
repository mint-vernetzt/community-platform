import { invariant } from "./response";

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("Failed to copy text to clipboard:", error);
    invariant(false, "Failed to copy text to clipboard");
  }
}
