import { render } from "@testing-library/react";
import ProfileCard from "./ProfileCard";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(
    <ProfileCard
      id="some-id"
      link="some-link"
      name="some-name"
      initials="some-initials"
    />
  );
  expect(baseElement).toBeTruthy();
});
