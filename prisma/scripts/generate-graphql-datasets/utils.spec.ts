import { addUuids } from "./utils";
// @ts-ignore
import { v4 } from "uuid";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("uuid", () => {
  return { v4: jest.fn() };
});

test("add existing uuids to wanted data by referenceId", () => {
  const wanted = [
    { referenceId: 1, title: "wanted title 1", slug: "wanted slug 1" },
    { referenceId: 2, title: "wanted title 2", slug: "wanted slug 2" },
    { referenceId: 3, title: "wanted title 3", slug: "wanted slug 3" },
    { referenceId: 4, title: "wanted title 4", slug: "wanted slug 4" },
  ];

  const existing = [
    { id: "4", referenceId: 1, title: "title 1", slug: "slug 1" },
    { id: "3", referenceId: 2, title: "title 2", slug: "slug 2" },
    { id: "2", referenceId: 3, title: "title 3", slug: "slug 3" },
    { id: "1", referenceId: 4, title: "title 4", slug: "slug 4" },
  ];

  expect(addUuids(wanted, existing)).toStrictEqual([
    { id: "4", referenceId: 1, title: "wanted title 1", slug: "wanted slug 1" },
    { id: "3", referenceId: 2, title: "wanted title 2", slug: "wanted slug 2" },
    { id: "2", referenceId: 3, title: "wanted title 3", slug: "wanted slug 3" },
    { id: "1", referenceId: 4, title: "wanted title 4", slug: "wanted slug 4" },
  ]);
});

test("generate new uuids for unknown entries", () => {
  const wanted = [
    { referenceId: 1, title: "wanted title 1", slug: "wanted slug 1" },
    { referenceId: 2, title: "wanted title 2", slug: "wanted slug 2" },
    { referenceId: 3, title: "wanted title 3", slug: "wanted slug 3" },
    { referenceId: 4, title: "wanted title 4", slug: "wanted slug 4" },
    {
      referenceId: 5,
      title: "unknown entry title",
      slug: "unknown entry slug",
    },
  ];

  const existing = [
    { id: "4", referenceId: 1, title: "title 1", slug: "slug 1" },
    { id: "3", referenceId: 2, title: "title 2", slug: "slug 2" },
    { id: "2", referenceId: 3, title: "title 3", slug: "slug 3" },
    { id: "1", referenceId: 4, title: "title 4", slug: "slug 4" },
  ];

  (v4 as jest.Mock).mockImplementationOnce(() => {
    return "5";
  });

  expect(addUuids(wanted, existing)).toStrictEqual([
    { id: "4", referenceId: 1, title: "wanted title 1", slug: "wanted slug 1" },
    { id: "3", referenceId: 2, title: "wanted title 2", slug: "wanted slug 2" },
    { id: "2", referenceId: 3, title: "wanted title 3", slug: "wanted slug 3" },
    { id: "1", referenceId: 4, title: "wanted title 4", slug: "wanted slug 4" },
    {
      id: "5",
      referenceId: 5,
      title: "unknown entry title",
      slug: "unknown entry slug",
    },
  ]);
});
