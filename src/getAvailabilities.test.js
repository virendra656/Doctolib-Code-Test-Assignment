import knex from "knexClient";
import getAvailabilities from "./getAvailabilities";

describe("getAvailabilities", () => {
  beforeEach(() => knex("events").truncate());

  describe("case 1", () => {
    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"));
      expect(availabilities.length).toBe(7);
      for (let i = 0; i < 7; ++i) {
        expect(availabilities[i].slots).toEqual([]);
      }
    });
  });

  describe("case 2", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2014-08-11 10:30"),
          ends_at: new Date("2014-08-11 11:30")
        },
        {
          kind: "opening",
          starts_at: new Date("2014-08-04 09:30"),
          ends_at: new Date("2014-08-04 12:30"),
          weekly_recurring: true
        }
      ]);
    });

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2014-08-10"));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2014-08-10"))
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2014-08-11"))
      );
      expect(availabilities[1].slots).toEqual([
        "9:30",
        "10:00",
        "11:30",
        "12:00"
      ]);

      expect(String(availabilities[6].date)).toBe(
        String(new Date("2014-08-16"))
      );
    });
  });

  describe("case 3", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2019-09-22 10:30"),
          ends_at: new Date("2019-09-22 11:30")
        },
        {
          kind: "opening",
          starts_at: new Date("2019-09-04 09:30"),
          ends_at: new Date("2019-09-04 12:30"),
          weekly_recurring: true
        }
      ]);
    });

    it("test 1", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2019-09-21"))
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[1].date)).toBe(
        String(new Date("2019-09-22"))
      );

      expect(String(availabilities[4].date)).toBe(
        String(new Date("2019-09-25"))
      );

      expect(availabilities[4].slots).toEqual(['9:30', '10:00', '10:30', '11:00', '11:30', '12:00']);
    });
  });

  describe("case 4", () => {
    beforeEach(async () => {
      await knex("events").insert([
        {
          kind: "appointment",
          starts_at: new Date("2019-09-29 10:30"),
          ends_at: new Date("2019-09-29 11:30")
        },
        {
          kind: "opening",
          starts_at: new Date("2019-09-15 09:30"),
          ends_at: new Date("2019-09-15 12:30"),
          weekly_recurring: true
        },
        {
          kind: "appointment",
          starts_at: new Date("2019-10-07 10:30"),
          ends_at: new Date("2019-10-07 11:30")
        },
        {
          kind: "opening",
          starts_at: new Date("2019-10-07 09:30"),
          ends_at: new Date("2019-10-07 12:30"),
          weekly_recurring: false
        }
      ]);
    });

    it("check availability for more than 7 days", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"), 17);

      expect(availabilities.length).toBe(17);

      expect(String(availabilities[0].date)).toBe(
        String(new Date("2019-09-21"))
      );


      expect(availabilities[0].slots).toEqual([]);

      expect(availabilities[1].slots).toEqual(['9:30', '10:00', '10:30', '11:00', '11:30', '12:00']);

      expect(availabilities[8].slots).toEqual(['9:30', '10:00', '11:30', '12:00']);

    });

    it("check availability non recurring and recurring openings", async () => {
      const availabilities = await getAvailabilities(new Date("2019-09-21"), 17);

      expect(String(availabilities[16].date)).toBe(
        String(new Date("2019-10-07"))
      );

      // it is non recurring with appointment
      expect(availabilities[16].slots).toEqual(['9:30', '10:00', '11:30', '12:00']);
    });


  });
});