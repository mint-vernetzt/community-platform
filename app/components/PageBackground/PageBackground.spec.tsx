import { render } from "@testing-library/react";
import PageBackground from "./PageBackground";

test("render component", () => {
  const { baseElement } = render(
    <PageBackground imagePath="some-image-path" />
  );
  expect(baseElement).toBeTruthy();
});
