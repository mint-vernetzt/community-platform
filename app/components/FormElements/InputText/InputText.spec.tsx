import { render } from "@testing-library/react";
import InputText from "./InputText";

test("render component", () => {
  const { baseElement } = render(<InputText label="some-label" />);
  expect(baseElement).toBeTruthy();
});
