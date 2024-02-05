import {
  dataToBeUpdated,
  entriesOnlyExistingOnDatabase,
  filterMissingData,
} from "./utils";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("filterMissingData", () => {
  const wanted = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  const existing = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 3" },
    { id: "3", title: "title 3" },
  ];

  expect(filterMissingData(wanted, existing)).toStrictEqual([
    { id: "4", title: "title 4" },
  ]);
});

test("dataToBeRenamed", () => {
  const wanted = [
    { id: "1", title: "NEW title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  const existing = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  expect(dataToBeUpdated(wanted, existing)).toStrictEqual([
    { id: "1", title: "NEW title 1" },
  ]);
});

test("entries only exists on database", () => {
  const wanted = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 2" },
    { id: "3", title: "title 3" },
  ];

  const existing = [
    { id: "1", title: "title 1" },
    { id: "2", title: "title 3" },
    { id: "3", title: "title 3" },
    { id: "4", title: "title 4" },
  ];

  expect(entriesOnlyExistingOnDatabase(wanted, existing)).toStrictEqual([
    { id: "4", title: "title 4" },
  ]);
});
