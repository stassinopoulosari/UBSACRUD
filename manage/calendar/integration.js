import { saveCalendar } from "../../api/calendar.js";
import {
  generateNewConfigurationKey,
  getConfiguration,
  saveConfiguration,
} from "../../api/configuration.js";
import { getSchedules } from "../../api/schedule.js";
import { getInstance } from "../../shared/userUtil.js";
import { renderCalendarView, navigateToMonth } from "./calendar.js";
import { startConfigurationView } from "./configuration.js";

getInstance("../../login").then((instanceRef) => {
  const generateConfigurationKey = (schoolYear, type) =>
    generateNewConfigurationKey(instanceRef, schoolYear, type);
  Promise.all([getConfiguration(instanceRef), getSchedules(instanceRef)]).then(
    (results) => {
      const [remoteConfiguration, schedules] = results;
      const reloadCalendar = (configuration) =>
        renderCalendarView(configuration, schedules);
      const navigateCalendar = (month, configuration) =>
        navigateToMonth(month, configuration, schedules);
      startConfigurationView(remoteConfiguration, schedules, {
        reloadCalendar: reloadCalendar,
        navigateCalendar: navigateCalendar,
        saveConfiguration: (configuration) =>
          saveConfiguration(instanceRef, configuration),
        saveCalendar: (calendar) => saveCalendar(instanceRef, calendar),
        generateConfigurationKey: generateConfigurationKey,
      });
      reloadCalendar(remoteConfiguration);
    },
  );
});
