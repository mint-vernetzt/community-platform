import {
  getDateDuration,
  getDuration,
  getDurationOLD,
  getFormattedDate,
  getTimeDuration,
} from "~/lib/utils/time";

describe("time.ts should format date/time strings  correctly", () => {
  describe("test 'getDateDuration' method", () => {
    const data = [
      [
        new Date("2023-10-07"),
        new Date("2023-10-07"),
        "de",
        "07. Oktober 2023",
      ],
      [
        new Date("2023-10-10"),
        new Date("2023-10-10"),
        "de",
        "10. Oktober 2023",
      ],
      [
        new Date("2023-10-07"),
        new Date("2023-10-11"),
        "de",
        "07. – 11. Oktober 2023",
      ],
      [
        new Date("2023-10-10"),
        new Date("2023-11-10"),
        "de",
        "10. Okt. – 10. Nov. 2023",
      ],
      [
        new Date("2022-10-10"),
        new Date("2023-11-10"),
        "de",
        "10. Okt. 2022 – 10. Nov. 2023",
      ],
      [
        new Date("2023-10-10"),
        new Date("2023-10-10"),
        "en",
        "October 10, 2023",
      ],
      [
        new Date("2023-10-10"),
        new Date("2023-10-11"),
        "en",
        "October 10 – 11, 2023",
      ],
      [
        new Date("2023-10-10"),
        new Date("2023-11-10"),
        "en",
        "Oct 10 – Nov 10, 2023",
      ],
      [
        new Date("2022-10-10"),
        new Date("2023-11-10"),
        "en",
        "Oct 10, 2022 – Nov 10, 2023",
      ],
    ];

    // @ts-ignore
    it.each(data)(
      "formats date duration right",
      (
        startTime: Date,
        endTime: Date,
        language: string,
        expectation: string
      ) => {
        const result = getDateDuration(startTime, endTime, language);
        expect(result).toEqual(expectation);
      }
    );
  });

  describe("test 'getFormattedDate' method", () => {
    const data = [
      [new Date("2023-10-10"), "de", "10. Oktober 2023"],
      [new Date("2023-10-10"), "en", "October 10, 2023"],
    ];

    // @ts-ignore
    it.each(data)(
      "formats date right",
      (date: Date, language: string, expectation: string) => {
        const result = getFormattedDate(date, language);
        expect(result).toEqual(expectation);
      }
    );
  });

  describe("test 'getTimeDuration' method", () => {
    const data = [
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 10:00"),
        "de",
        "10:00 Uhr",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 11:23"),
        "de",
        "10:00 - 11:23 Uhr",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 12:00"),
        "de",
        "10:00 - 12:00 Uhr",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 10:00"),
        "en",
        "10:00 AM",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 11:37"),
        "en",
        "10:00 - 11:37 AM",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 12:00"),
        "en",
        "10:00 AM - 12:00 PM",
      ],
    ];

    // @ts-ignore
    it.each(data)(
      "formats date duration right",
      (
        startTime: Date,
        endTime: Date,
        language: string,
        expectation: string
      ) => {
        const result = getTimeDuration(startTime, endTime, language);
        expect(result).toEqual(expectation);
      }
    );
  });

  describe("test 'getDurationOLD' method", () => {
    const data = [
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 10:00"),
        "de",
        "10. Oktober 2023 | 10:00 Uhr",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 11:23"),
        "de",
        "10. Oktober 2023 | 10:00 – 11:23 Uhr",
      ],
      [
        new Date("2023-10-09 10:00"),
        new Date("2023-10-10 10:00"),
        "de",
        "09. – 10. Oktober 2023",
      ],
      [
        new Date("2023-10-09 10:00"),
        new Date("2023-10-10 11:23"),
        "de",
        "09. – 10. Oktober 2023",
      ],
      [
        new Date("2023-03-09 10:00"),
        new Date("2023-10-10 11:23"),
        "de",
        "09. März – 10. Okt. 2023",
      ],
    ];

    // @ts-ignore
    it.each(data)(
      "OLD: formats datetime duration right",
      (
        startTime: Date,
        endTime: Date,
        language: string,
        expectation: string
      ) => {
        expect(getDurationOLD(startTime, endTime, language)).toEqual(
          expectation
        );
      }
    );

    const extended = [
      ...data,
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 10:00"),
        "en",
        "October 10, 2023 | 10:00 AM",
      ],
      [
        new Date("2023-10-10 10:00"),
        new Date("2023-10-10 11:23"),
        "en",
        "October 10, 2023 | 10:00 – 11:23 AM",
      ],
      [
        new Date("2023-10-09 10:00"),
        new Date("2023-10-10 10:00"),
        "en",
        "October 09 – 10, 2023",
      ],
      [
        new Date("2023-10-09 10:00"),
        new Date("2023-10-10 11:23"),
        "en",
        "October 09 – 10, 2023",
      ],
      [
        new Date("2023-03-09 10:00"),
        new Date("2023-10-10 11:23"),
        "en",
        "Mar 09 – Oct 10, 2023",
      ],
    ];

    // @ts-ignore
    it.each(extended)(
      "NEW: formats datetime duration right",
      (
        startTime: Date,
        endTime: Date,
        language: string,
        expectation: string
      ) => {
        expect(getDuration(startTime, endTime, language)).toEqual(expectation);
      }
    );
  });
});
