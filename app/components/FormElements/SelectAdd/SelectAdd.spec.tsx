import { render } from "@testing-library/react";
import SelectAdd from "./SelectAdd";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(<SelectAdd name="test" label={""} />);
  expect(baseElement).toBeTruthy();
});
