import { render } from "@testing-library/react";
import OrganizationPage from "./OrganizationPage";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<OrganizationPage />);
  expect(baseElement).toBeTruthy();
});
