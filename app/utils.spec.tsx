import { generateUsername } from "./utils";

// TODO: add more names to test
test("generate username", () => {
  const testData: {
    given: { firstName: string; lastName: string };
    expected: string;
  }[] = [
    { given: { firstName: "John", lastName: "Doe" }, expected: "johndoe" },
    {
      given: { firstName: "James T.", lastName: "Kirk" },
      expected: "jamestkirk",
    },
    {
      given: { firstName: "Vincent", lastName: "D'Onofrio" },
      expected: "vincentdonofrio",
    },
    {
      given: { firstName: "Peter", lastName: "Holló" },
      expected: "peterhollo",
    },
    {
      given: { firstName: "Anna", lastName: "Schröter" },
      expected: "annaschroeter",
    },
  ];
  expect.assertions(testData.length);
  testData.forEach((item) => {
    const { given, expected } = item;
    const username = generateUsername(given.firstName, given.lastName);
    expect(username).toBe(expected);
  });
});
