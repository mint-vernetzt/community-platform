import { installGlobals } from "@remix-run/node";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi, type MockInstance } from "vitest";

afterEach(() => cleanup());

installGlobals();

export let consoleError: MockInstance<(typeof console)["error"]>;

beforeEach(() => {
  const originalConsoleError = console.error;
  consoleError = vi.spyOn(console, "error");
  consoleError.mockImplementation(
    (...args: Parameters<typeof console.error>) => {
      originalConsoleError(...args);
      throw new Error(
        "Console error was called. Call consoleError.mockImplementation(() => {}) if this is expected."
      );
    }
  );
});
