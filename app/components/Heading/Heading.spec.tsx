import { render, screen } from "@testing-library/react";

import { H1, H2, H3, H4, H5, H6 } from "./Heading";

test("render heading of different levels", () => {
  render(<H1>Hello Heading</H1>);
  const heading1DOM = screen.getByRole("heading", { level: 1 });
  expect(heading1DOM).toBeTruthy();

  render(<H2>Hello Heading</H2>);
  const heading2DOM = screen.getByRole("heading", { level: 2 });
  expect(heading2DOM).toBeTruthy();

  render(<H3>Hello Heading</H3>);
  const heading3DOM = screen.getByRole("heading", { level: 3 });
  expect(heading3DOM).toBeTruthy();

  render(<H4>Hello Heading</H4>);
  const heading4DOM = screen.getByRole("heading", { level: 4 });
  expect(heading4DOM).toBeTruthy();

  render(<H5>Hello Heading</H5>);
  const heading5DOM = screen.getByRole("heading", { level: 5 });
  expect(heading5DOM).toBeTruthy();

  render(<H6>Hello Heading</H6>);
  const heading6DOM = screen.getByRole("heading", { level: 6 });
  expect(heading6DOM).toBeTruthy();
});

test("render heading content", () => {
  const content = "Heading Content";

  render(<H1>{content}</H1>);
  const headingDOM = screen.getByText(content);
  expect(headingDOM).toBeTruthy();
});

test("render heading with different style", () => {
  const like = "h2";
  render(<H1 like={like}>Hello Heading</H1>);
  const heading1DOM = screen.getByRole("heading", { level: 1 });
  expect(heading1DOM.classList.contains(like)).toBe(true);
});
