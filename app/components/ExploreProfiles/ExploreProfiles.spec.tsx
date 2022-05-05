import { render } from "@testing-library/react";
import ExploreProfiles from "./ExploreProfiles";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<ExploreProfiles />);
  expect(baseElement).toBeTruthy();
});
