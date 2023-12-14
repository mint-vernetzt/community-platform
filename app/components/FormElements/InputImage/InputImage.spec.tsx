import { render } from "@testing-library/react";
import InputImage from "./InputImage";
import React from "react";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const ref = React.createRef<HTMLDivElement>();
  const { baseElement } = render(
    <InputImage containerRef={ref} containerClassName="" imageClassName="" />
  );
  expect(baseElement).toBeTruthy();
});
