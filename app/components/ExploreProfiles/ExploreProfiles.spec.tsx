import { render } from "@testing-library/react";
import ExploreProfiles from "./ExploreProfiles";

// TODO: fix type issue
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(<ExploreProfiles />);
  expect(baseElement).toBeTruthy();
});
