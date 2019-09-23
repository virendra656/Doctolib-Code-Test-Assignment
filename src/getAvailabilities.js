import moment from "moment";
import knex from "knexClient";


/**
 * 
 * @param {*} availabilitiesKeys 
 * @param {*} date 
 * @return matched date keys for a given day on recurring events
 */

function getDateKeysOnEventDate(availabilitiesKeys, date, weekly_recurring) {
  let matchedDateKeys = []; //holds date keys
  availabilitiesKeys.forEach(dateKey => {
    if (weekly_recurring && date.format("d") === moment(new Date(dateKey)).format("d")) {
      matchedDateKeys.push(dateKey);
    }
    else if (!weekly_recurring && date.format("YYYY-MM-DD") === dateKey) {
      matchedDateKeys.push(dateKey);
    }
  });
  return matchedDateKeys;
}


/**
 * 
 * @param {*} date 
 * @return generates dates with empty slosts for any given days
 */

function generateAvailabilitySchema(date, numberOfDays) {
  const availabilities = new Map();
  for (let i = 0; i < numberOfDays; ++i) {
    const tmpDate = moment(date).add(i, "days");
    availabilities.set(tmpDate.format("YYYY-MM-DD"), {
      date: tmpDate.toDate(),
      slots: []
    });
  }
  return availabilities;
}

/**
 * 
 * @param {*} date 
 * return appointment, opening(recurring or non recurring)
 */
function getEventsForDate(date) {
  return knex
    .select("kind", "starts_at", "ends_at", "weekly_recurring")
    .from("events")
    .where(function () {
      this.where("weekly_recurring", true).orWhere("ends_at", ">", +date);
    }).orderBy('kind', 'desc');
}
/**
 * 
 * @param {*} availabilitiesKeysByDay 
 * @param {*} availabilities 
 * @param {*} date 
 * sets slots for given date on opening event
 */
function fillSlots(availabilitiesKeysByDay, availabilities, date) {
  availabilitiesKeysByDay.forEach(dateKey => {
    const day = availabilities.get(dateKey);
    if (day.slots.indexOf(date.format("H:mm")) < 0) {
      day.slots.push(date.format("H:mm"));
    }
  });
}

/**
 * 
 * @param {*} availabilitiesKeysByDay 
 * @param {*} availabilities 
 * @param {*} date 
 * filter slots for given date on appointment event
 */
function filterSlots(availabilitiesKeysByDay, availabilities, date) {
  availabilitiesKeysByDay.forEach(dateKey => {
    const day = availabilities.get(dateKey);
    day.slots = day.slots.filter(
      slot => slot.indexOf(date.format("H:mm")) === -1
    );
  });
}

/**
 * 
 * @param {*} date 
 * @param {*} numberOfDays (optional)
 * returns availability for any given days
 */

export default async function getAvailabilities(date, numberOfDays = 7) {

  const availabilities = generateAvailabilitySchema(date, numberOfDays); //holds empty slots for given date and num days
  const availabilitiesKeys = Array.from(availabilities.keys()); //holds dates keys for availabilities
  const events = await getEventsForDate(date);// find events 

  for (const event of events) {
    for (
      let date = moment(event.starts_at);
      date.isBefore(event.ends_at);
      date.add(30, "minutes")
    ) {
      const dateKeysOnEvent = getDateKeysOnEventDate(availabilitiesKeys, date, event.weekly_recurring);

      switch (event.kind) {
        case "opening":
          fillSlots(dateKeysOnEvent, availabilities, date);
          break;
        case "appointment":
          filterSlots(dateKeysOnEvent, availabilities, date);
          break;
      }
    }
  }
  
  return Array.from(availabilities.values())
}