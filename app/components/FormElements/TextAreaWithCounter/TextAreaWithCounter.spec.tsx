import { render } from "@testing-library/react";
import TextAreaWithCounter from "./TextAreaWithCounter";

test("render component", () => {
  const { baseElement } = render(
    <TextAreaWithCounter label="some-label" id="some-id" />
  );
  expect(baseElement).toBeTruthy();
});
