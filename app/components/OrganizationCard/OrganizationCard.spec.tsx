import { render } from "@testing-library/react";
import OrganizationCard from "./OrganizationCard";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<OrganizationCard />);
  expect(baseElement).toBeTruthy();
});
