import { Offer } from "@prisma/client";
import {
  dataOnlyExisting,
  dataToBeUpdated,
  filterMissingData,
  makeLookup,
} from "./index";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("data only exists in database", () => {
  const wanted: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
  ];

  const existing: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 3" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  expect(dataOnlyExisting(wanted, existing)).toStrictEqual([
    { id: "4", title: "title 4" },
  ]);
});

test("filterMissingData", () => {
  const wanted: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  const existing: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 3" },
    { id: "3", title: "title 3" },
  ];

  expect(filterMissingData(wanted, existing)).toStrictEqual([
    { id: "4", title: "title 4" },
  ]);
});

test("makeLookup", () => {
  const someOffers: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
  ];
  expect(makeLookup(someOffers)).toStrictEqual({
    1: { id: "1", title: "title 1" },
    2: { id: "2", title: "title 2" },
    3: { id: "3", title: "title 3" },
  });
});

test("dataToBeRenamed", () => {
  const wanted: Offer[] = [
    { id: "1", title: "NEW title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  const existing: Offer[] = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  expect(dataToBeUpdated(wanted, existing)).toStrictEqual([
    { id: "1", title: "NEW title 1" },
  ]);
});
