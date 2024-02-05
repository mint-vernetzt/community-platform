import { render } from "@testing-library/react";
import InputImage from "./InputImage";
import React from "react";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const ref = React.createRef<HTMLDivElement>();
  const { baseElement } = render(
    <InputImage containerRef={ref} containerClassName="" imageClassName="" />
  );
  expect(baseElement).toBeTruthy();
});
