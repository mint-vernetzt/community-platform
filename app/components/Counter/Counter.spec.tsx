import { render } from "@testing-library/react";

import Counter from "./Counter";

// TODO: fix type issue
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

describe("Counter", () => {
  it("TODO: What do i want to test?", () => {
    const { baseElement } = render(<Counter currentCount={0} maxCount={300} />);
    expect(baseElement).toBeTruthy();
  });
});
