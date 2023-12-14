import { render } from "@testing-library/react";
import ImageCropper from "./ImageCropper";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(
    <ImageCropper
      id="some-id"
      headline="some-headline"
      subject="user"
      uploadKey="avatar"
      minCropHeight={100}
      minCropWidth={100}
      maxTargetHeight={400}
      maxTargetWidth={400}
      children={undefined}
    />
  );
  expect(baseElement).toBeTruthy();
});
