import * as db from "./db.js";

export const saveCalendar = (instanceRef, calendar) =>
  db
    .set(db.child(instanceRef, `/calendars`), calendar)
    .then(() =>
      db.set(db.child(instanceRef, "/lastUpdated"), new Date().getTime()),
    );
