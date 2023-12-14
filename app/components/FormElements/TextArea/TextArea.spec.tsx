import { render } from "@testing-library/react";
import TextArea from "./TextArea";

test("render component", () => {
  const { baseElement } = render(<TextArea label="some-label" id="some-id" />);
  expect(baseElement).toBeTruthy();
});
