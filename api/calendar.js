import * as db from "./db.js";

export const saveCalendar = (instanceRef, calendar, lastPushed) =>
  db
    .set(db.child(instanceRef, `/calendars`), calendar)
    .then(() => db.set(db.child(instanceRef, "/lastUpdated"), lastPushed));
