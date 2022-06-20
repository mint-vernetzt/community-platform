import { render } from "@testing-library/react";

import Counter from "./Counter";

describe("Counter", () => {
  it("TODO: What do i want to test?", () => {
    const { baseElement } = render(<Counter currentCount={0} maxCount={300} />);
    expect(baseElement).toBeTruthy();
  });
});
