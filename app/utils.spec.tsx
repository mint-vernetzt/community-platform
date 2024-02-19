import {
  generateEventSlug,
  generateOrganizationSlug,
  generateUsername,
} from "./utils.server";

// TODO: add more names to test
// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;
test("generate username", () => {
  const testData: {
    given: { firstName: string; lastName: string };
    expected: string;
  }[] = [
    {
      given: { firstName: "John", lastName: "Doe" },
      expected: "johndoe",
    },
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
    expect(username.startsWith(`${expected}-`)).toBe(true);
  });
});

test("generate organization slug", () => {
  const testData: {
    given: { organizationName: string };
    expected: string;
  }[] = [
    {
      given: { organizationName: "Körber Stiftung" },
      expected: "koerberstiftung",
    },
    {
      given: { organizationName: "Haus der kleinen Forscher" },
      expected: "hausderkleinenforscher",
    },
    {
      given: { organizationName: "MINTvernetzt" },
      expected: "mintvernetzt",
    },
    {
      given: { organizationName: "L'organisation" },
      expected: "lorganisation",
    },
    {
      given: { organizationName: "órgànisation" },
      expected: "organisation",
    },
  ];
  expect.assertions(testData.length);
  testData.forEach((item) => {
    const { given, expected } = item;
    const organizationName = generateOrganizationSlug(given.organizationName);
    expect(organizationName.startsWith(`${expected}-`)).toBe(true);
  });
});

test("generate event slug", () => {
  const testData: {
    given: { eventName: string };
    expected: string;
  }[] = [
    {
      given: { eventName: "My Event" },
      expected: "myevent",
    },
  ];

  expect.assertions(testData.length);
  testData.forEach((item) => {
    const { given, expected } = item;
    const eventName = generateEventSlug(given.eventName);
    expect(eventName.startsWith(`${expected}-`)).toBe(true);
  });
});
