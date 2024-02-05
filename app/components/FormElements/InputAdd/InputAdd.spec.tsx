import { render } from "@testing-library/react";
import InputAdd from "./InputAdd";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(
    <InputAdd entries={[]} label={""} name={""} />
  );
  expect(baseElement).toBeTruthy();
});
