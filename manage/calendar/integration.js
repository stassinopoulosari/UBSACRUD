import { getConfigurationReferenceForUser } from "../../api/auth.js";
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

Promise.all([
  getInstance("../../login"),
  getConfigurationReferenceForUser(),
]).then((refs) => {
  const [instanceRef, configurationRef] = refs;
  const generateConfigurationKey = (schoolYear, type) =>
    generateNewConfigurationKey(instanceRef, schoolYear, type);
  Promise.all([
    getConfiguration(configurationRef),
    getSchedules(instanceRef),
  ]).then((results) => {
    const [remoteConfiguration, schedules] = results;
    const reloadCalendar = (configuration) =>
      renderCalendarView(configuration, schedules);
    const navigateCalendar = (month, configuration) =>
      navigateToMonth(month, configuration, schedules);
    startConfigurationView(remoteConfiguration, schedules, {
      reloadCalendar: reloadCalendar,
      navigateCalendar: navigateCalendar,
      saveConfiguration: (configuration) =>
        saveConfiguration(configurationRef, configuration),
      saveCalendar: (calendar, lastPushed) =>
        saveCalendar(instanceRef, calendar, lastPushed),
      generateConfigurationKey: generateConfigurationKey,
    });
    reloadCalendar(remoteConfiguration);
  });
});
