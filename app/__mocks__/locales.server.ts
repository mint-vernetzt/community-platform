import { beforeEach } from "vitest";
import { mockFn, mockReset } from "vitest-mock-extended";
import { type getLocaleFiles as originalGetLocaleFiles } from "~/routes/i18n/locales.server";

beforeEach(() => {
  mockReset(getLocaleFiles);
});

const getLocaleFiles = mockFn<typeof originalGetLocaleFiles>();

export { getLocaleFiles };
