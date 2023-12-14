import { render } from "@testing-library/react";
import OrganizationCard from "./OrganizationCard";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(
    <OrganizationCard id="some-id" link="some-link" name="some-name" />
  );
  expect(baseElement).toBeTruthy();
});
