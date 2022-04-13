import { render } from "@testing-library/react";
import InputAdd from "./InputAdd";

test("render component", () => {
  const { baseElement } = render(<InputAdd />);
  expect(baseElement).toBeTruthy();
});
