import { render } from "@testing-library/react";
import ProfileCard from "./ProfileCard";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

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
