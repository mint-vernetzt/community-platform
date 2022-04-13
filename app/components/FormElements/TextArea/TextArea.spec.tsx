import { render } from "@testing-library/react";
import TextArea from "./TextArea";

test("render component", () => {
  const { baseElement } = render(<TextArea />);
  expect(baseElement).toBeTruthy();
});
