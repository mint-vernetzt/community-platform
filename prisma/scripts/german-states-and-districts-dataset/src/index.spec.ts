import { evaluateJsonObject, getAreas, prepareQueries } from "./index";

// @ts-ignore
const expect = global.expect as jest.Expect;

describe("test evaluateJsonObject() from index.js", () => {
  test("test basic functionality", () => {
    const testJson = {
      "01234": {
        name: "1",
        county: "LK 1",
        state: "BL1",
        uselessAttribute: "uselessValue",
      },
    };
    const stateResults = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
    ];
    const districtResults = [
      {
        ags: "01234",
        name: "1",
        type: "land",
        stateAgsPrefix: "01",
      },
    ];
    expect(evaluateJsonObject(testJson, "state", "name")).toStrictEqual({
      states: stateResults,
      districts: districtResults,
    });
  });

  test("test basic functionality with bigger object", () => {
    const testJson = {
      "01234": {
        ags: "01234",
        county: "LK1",
        name: "1",
        state: "BL1",
        uselessAttribute1: "uselessValue",
        uselessAttribute2: "uselessValue",
      },
      "02345": {
        ags: "02345",
        name: "2",
        county: "LK2",
        state: "BL2",
      },
      "02456": {
        ags: "02456",
        name: "3",
        county: "SK3",
        state: "BL2",
        uselessAttribute1: "uselessValue",
        uselessAttribute2: "uselessValue",
      },
      "01567": {
        ags: "01567",
        name: "4",
        county: "LK4",
        state: "BL1",
      },
    };
    const stateResults = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const districtResults = [
      {
        ags: "01234",
        name: "1",
        type: "land",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        type: "land",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        type: "urban",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        type: "land",
        stateAgsPrefix: "01",
      },
    ];
    expect(evaluateJsonObject(testJson, "state", "name")).toStrictEqual({
      states: stateResults,
      districts: districtResults,
    });
  });

  test("test with invalid ags (ags too short)", () => {
    const testJson = {
      "0123": {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(new Error("Invalid ags: 0123"));
  });

  test("test with invalid ags (ags too long)", () => {
    const testJson = {
      "0123456789": {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(new Error("Invalid ags: 0123456789"));
  });

  test("test with invalid ags (ags from letters)", () => {
    const testJson = {
      aaaaa: {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(new Error("Invalid ags: aaaaa"));
  });

  test("test with invalid ags (ags from letters and numbers)", () => {
    const testJson = {
      "111aa": {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(new Error("Invalid ags: 111aa"));
  });

  test("test with invalid stateKey", () => {
    const testJson = {
      "01234": {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
      "02235": {
        name: "2",
        county: "LK2",
        // missing state value
        bundesland: "BL2",
        uselessAttribute: "uselessValue",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(new Error("Invalid stateKey: state"));
  });

  test("test with invalid districtKey", () => {
    const testJson = {
      "01234": {
        name: "1",
        county: "LK1",
        state: "BL1",
        uselessAttribute: "uselessValue",
        community: "LK1",
      },
      "01235": {
        name: "2",
        county: "LK2",
        state: "BL1",
        uselessAttribute: "uselessValue",
        // missing community value
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "community");
    }).toThrowError(new Error("Invalid districtKey: community"));
  });

  test("test with two states that have the same name but different ags prefix", () => {
    const testJson = {
      "01234": {
        name: "1",
        county: "LK1",
        state: "BL1",
        community: "LK1",
      },
      "02235": {
        name: "2",
        county: "LK2",
        state: "BL1",
        community: "LK2",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "community");
    }).toThrowError(
      new Error(
        "There are states with the same name but different ags prefixes: BL1 (01) and BL1 (02)"
      )
    );
  });

  test("test with two districts that have the same name and county name but different ags", () => {
    const testJson = {
      "01234": {
        // This is actually an SK
        state: "BL1",
        name: "A",
        county: "SKA",
      },
      "01235": {
        // This is actually a LK
        state: "BL1",
        name: "A",
        county: "SKA",
      },
    };
    expect(() => {
      evaluateJsonObject(testJson, "state", "name");
    }).toThrowError(
      new Error(
        "There are districts with the same name but different ags: A (01234) and A (01235), maybe use a different districtKey?"
      )
    );
  });
});

// test prepareQueries
describe("test prepareQueries() from index.js", () => {
  test("test with existing states and districts (no changes needed)", () => {
    const currentStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const currentDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    const currentAreas = getAreas(currentDistricts, currentStates, []);
    const inputStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const inputDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    expect(
      prepareQueries(
        {
          states: currentStates,
          districts: currentDistricts,
          areas: currentAreas,
        },
        {
          states: inputStates,
          districts: inputDistricts,
        }
      )
    ).toEqual({
      insertStates: [],
      insertDistricts: [],
      insertAreas: [],
      updateDistricts: [],
      deleteDistricts: [],
      updateStates: [],
      deleteStates: [],
    });
  });

  test("test with empty database (create all)", () => {
    const currentStates: any[] = [];
    const currentDistricts: any[] = [];
    const inputStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const inputDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    const currentAreas = getAreas(currentDistricts, currentStates, []);
    expect(
      prepareQueries(
        {
          states: currentStates,
          districts: currentDistricts,
          areas: currentAreas,
        },
        { states: inputStates, districts: inputDistricts }
      )
    ).toEqual({
      insertStates: [
        {
          agsPrefix: "01",
          name: "BL1",
        },
        {
          agsPrefix: "02",
          name: "BL2",
        },
      ],
      insertDistricts: [
        {
          ags: "01234",
          name: "1",
          county: "LK1",
          stateAgsPrefix: "01",
        },
        {
          ags: "02345",
          name: "2",
          county: "LK2",
          stateAgsPrefix: "02",
        },
        {
          ags: "02456",
          name: "3",
          county: "LK3",
          stateAgsPrefix: "02",
        },
        {
          ags: "01567",
          name: "4",
          county: "LK4",
          stateAgsPrefix: "01",
        },
      ],
      insertAreas: [
        {
          name: "1",
          type: "district",
          stateId: "01",
        },
        {
          name: "2",
          type: "district",
          stateId: "02",
        },
        {
          name: "3",
          type: "district",
          stateId: "02",
        },
        {
          name: "4",
          type: "district",
          stateId: "01",
        },
        {
          name: "BL1",
          stateId: "01",
          type: "state",
        },
        {
          name: "BL2",
          stateId: "02",
          type: "state",
        },
      ],
      updateDistricts: [],
      deleteDistricts: [],
      updateStates: [],
      deleteStates: [],
    });
  });

  test("test with no input states and districts (delete all)", () => {
    const currentStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const currentDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    const currentAreas = getAreas(currentDistricts, currentStates, []);
    expect(
      prepareQueries(
        {
          states: currentStates,
          districts: currentDistricts,
          areas: currentAreas,
        },
        {
          states: [],
          districts: [],
        }
      )
    ).toEqual({
      insertStates: [],
      insertDistricts: [],
      insertAreas: [],
      updateDistricts: [],
      updateStates: [],
      deleteStates: [
        {
          agsPrefix: "01",
          name: "BL1",
        },
        {
          agsPrefix: "02",
          name: "BL2",
        },
      ],
      deleteDistricts: [
        {
          ags: "01234",
          name: "1",
          county: "LK1",
          stateAgsPrefix: "01",
        },
        {
          ags: "02345",
          name: "2",
          county: "LK2",
          stateAgsPrefix: "02",
        },
        {
          ags: "02456",
          name: "3",
          county: "LK3",
          stateAgsPrefix: "02",
        },
        {
          ags: "01567",
          name: "4",
          county: "LK4",
          stateAgsPrefix: "01",
        },
      ],
    });
  });

  test("test with existing states and districts (update all)", () => {
    const currentStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const currentDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    const currentAreas = getAreas(currentDistricts, currentStates, []);
    const inputStates = [
      {
        agsPrefix: "01",
        name: "BL1 (neu)",
      },
      {
        agsPrefix: "02",
        name: "BL2 (neu)",
      },
    ];
    const inputDistricts = [
      {
        ags: "01234",
        name: "1 (neu)",
        county: "LK1 (neu)",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2 (neu)",
        county: "LK2 (neu)",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3 (neu)",
        county: "LK3 (neu)",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4 (neu)",
        county: "LK4 (neu)",
        stateAgsPrefix: "01",
      },
    ];
    expect(
      prepareQueries(
        {
          states: currentStates,
          districts: currentDistricts,
          areas: currentAreas,
        },
        {
          states: inputStates,
          districts: inputDistricts,
        }
      )
    ).toEqual({
      insertStates: [],
      insertDistricts: [],
      updateStates: [
        {
          agsPrefix: "01",
          name: "BL1 (neu)",
        },
        {
          agsPrefix: "02",
          name: "BL2 (neu)",
        },
      ],
      updateDistricts: [
        {
          ags: "01234",
          name: "1 (neu)",
          county: "LK1 (neu)",
          stateAgsPrefix: "01",
        },
        {
          ags: "02345",
          name: "2 (neu)",
          county: "LK2 (neu)",
          stateAgsPrefix: "02",
        },
        {
          ags: "02456",
          name: "3 (neu)",
          county: "LK3 (neu)",
          stateAgsPrefix: "02",
        },
        {
          ags: "01567",
          name: "4 (neu)",
          county: "LK4 (neu)",
          stateAgsPrefix: "01",
        },
      ],
      insertAreas: [
        {
          name: "1 (neu)",
          type: "district",
          stateId: "01",
        },
        {
          name: "2 (neu)",
          type: "district",
          stateId: "02",
        },
        {
          name: "3 (neu)",
          type: "district",
          stateId: "02",
        },
        {
          name: "4 (neu)",
          type: "district",
          stateId: "01",
        },
        {
          name: "BL1 (neu)",
          stateId: "01",
          type: "state",
        },
        {
          name: "BL2 (neu)",
          stateId: "02",
          type: "state",
        },
      ],
      deleteStates: [],
      deleteDistricts: [],
    });
  });

  test("test with everything  (create, update and delete)", () => {
    const currentStates = [
      {
        agsPrefix: "01",
        name: "BL1",
      },
      {
        agsPrefix: "02",
        name: "BL2",
      },
    ];
    const currentDistricts = [
      {
        ags: "01234",
        name: "1",
        county: "LK1",
        stateAgsPrefix: "01",
      },
      {
        ags: "02345",
        name: "2",
        county: "LK2",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3",
        county: "LK3",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4",
        county: "LK4",
        stateAgsPrefix: "01",
      },
    ];
    const currentAreas = getAreas(currentDistricts, currentStates, []);
    const inputStates = [
      {
        agsPrefix: "02",
        name: "BL2 (neu)",
      },
      {
        agsPrefix: "03",
        name: "BL3",
      },
    ];
    const inputDistricts = [
      {
        ags: "02345",
        name: "2 (neu)",
        county: "LK2 (neu)",
        stateAgsPrefix: "02",
      },
      {
        ags: "02456",
        name: "3 (neu)",
        county: "LK3 (neu)",
        stateAgsPrefix: "02",
      },
      {
        ags: "01567",
        name: "4 (neu)",
        county: "LK4 (neu)",
        stateAgsPrefix: "01",
      },
      {
        ags: "03567",
        name: "5",
        county: "LK5",
        stateAgsPrefix: "03",
      },
    ];
    expect(
      prepareQueries(
        {
          states: currentStates,
          districts: currentDistricts,
          areas: currentAreas,
        },
        {
          states: inputStates,
          districts: inputDistricts,
        }
      )
    ).toEqual({
      insertStates: [
        {
          agsPrefix: "03",
          name: "BL3",
        },
      ],
      insertDistricts: [
        {
          ags: "03567",
          name: "5",
          county: "LK5",
          stateAgsPrefix: "03",
        },
      ],
      insertAreas: [
        {
          name: "2 (neu)",
          type: "district",
          stateId: "02",
        },
        {
          name: "3 (neu)",
          type: "district",
          stateId: "02",
        },
        {
          name: "4 (neu)",
          type: "district",
          stateId: "01",
        },
        {
          name: "5",
          type: "district",
          stateId: "03",
        },
        {
          name: "BL2 (neu)",
          stateId: "02",
          type: "state",
        },
        {
          name: "BL3",
          type: "state",
          stateId: "03",
        },
      ],
      updateStates: [
        {
          agsPrefix: "02",
          name: "BL2 (neu)",
        },
      ],
      updateDistricts: [
        {
          ags: "02345",
          name: "2 (neu)",
          county: "LK2 (neu)",
          stateAgsPrefix: "02",
        },
        {
          ags: "02456",
          name: "3 (neu)",
          county: "LK3 (neu)",
          stateAgsPrefix: "02",
        },
        {
          ags: "01567",
          name: "4 (neu)",
          county: "LK4 (neu)",
          stateAgsPrefix: "01",
        },
      ],
      deleteStates: [
        {
          agsPrefix: "01",
          name: "BL1",
        },
      ],
      deleteDistricts: [
        {
          ags: "01234",
          name: "1",
          county: "LK1",
          stateAgsPrefix: "01",
        },
      ],
    });
  });
});
