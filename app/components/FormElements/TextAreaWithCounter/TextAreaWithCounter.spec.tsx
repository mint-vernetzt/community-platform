import { render } from "@testing-library/react";
import TextAreaWithCounter from "./TextAreaWithCounter";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(
    <TextAreaWithCounter label="some-label" id="some-id" />
  );
  expect(baseElement).toBeTruthy();
});
