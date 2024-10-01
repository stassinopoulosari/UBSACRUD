import * as db from "./db.js";

export const saveCalendar = (instanceRef, calendar) =>
  db
    .set(db.child(instanceRef, `/calendars`), calendar)
    .then(() =>
      db.set(
        db.child(instanceRef, "/lastUpdated"),
        Math.floor(new Date().getTime() / 1000),
      ),
    );
