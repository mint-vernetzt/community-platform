import { render } from "@testing-library/react";
import OrganizationCard from "./OrganizationCard";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(
    <OrganizationCard id="some-id" link="some-link" name="some-name" />
  );
  expect(baseElement).toBeTruthy();
});
