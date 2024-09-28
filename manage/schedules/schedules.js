import { getSchedules } from "../../api/schedule.js";
import { getSymbols } from "../../api/symbols.js";
import { parseQuery } from "../../shared/parseQuery.js";
import { getInstance } from "../../shared/userUtil.js";
import { setupScheduleView } from "./singleSchedule.js";
import { setupAllSchedulesView } from "./allSchedules.js";

getInstance("../../login").then((instanceRef) => {
  Promise.all([getSymbols(instanceRef), getSchedules(instanceRef)]).then(
    (results) => {
      const symbols = results[0],
        schedules = results[1],
        invertedSymbols = {};
      for (const symbolKey in symbols) {
        const symbolValue = symbols[symbolKey].value;
        invertedSymbols[symbolValue] = symbolKey;
      }

      // Split into individual schedule view and into all schedules view
      const scheduleKeys = Object.keys(schedules),
        scheduleID = parseQuery(location.search).schedule;

      if (scheduleID !== undefined && scheduleKeys.includes(scheduleID)) {
        return setupScheduleView(
          instanceRef,
          symbols,
          invertedSymbols,
          scheduleID,
          schedules[scheduleID],
        );
      } else if (scheduleID !== undefined)
        history.pushState("", "", location.href.split("?")[0]);

      return setupAllSchedulesView(instanceRef, schedules);
    },
  );
});
