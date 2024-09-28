import {
  compareDateStrings,
  componentsToString,
  DAYS_OF_WEEK,
  stringOnInterval,
  stringToDate,
} from "./dateUtils.js";
import * as db from "./db.js";
export const CONFIGURATION_INTERSTITIAL = "/ubsacrud",
  MATCHES = {
    defaultWeek: "Default week",
    specialSchedule: "Special schedule",
    break: "Break",
    none: "No school year",
  };

export const defaultConfiguration = {
  schoolYears: [],
};

export const getScheduleForDateString = (configuration, dateString) => {
    const matchingSchoolYears = Object.values(
      configuration.schoolYears ?? {},
    ).filter((schoolYearObject) => {
      const schoolYearStart = schoolYearObject.bounds.startDate,
        schoolYearEnd = schoolYearObject.bounds.endDate,
        schoolYearInterval = [schoolYearStart, schoolYearEnd];
      return stringOnInterval(dateString, schoolYearInterval, true);
    });

    if (matchingSchoolYears.length === 0)
      return [null, { matched: "none", schoolYearObject: null }];
    const schoolYearObject = matchingSchoolYears[0];
    // First, match breaks
    const breaks =
      schoolYearObject.breaks === undefined ? {} : schoolYearObject.breaks;
    for (const breakObject of Object.values(breaks)) {
      const breakSchedule = breakObject.defaultSchedule || null,
        breakStart = breakObject.startDate,
        breakEnd = breakObject.endDate,
        breakInterval = [breakStart, breakEnd];
      if (stringOnInterval(dateString, breakInterval, true))
        return [
          breakSchedule,
          {
            matched: "break",
            schoolYear: schoolYearObject,
            attachment: breakObject,
          },
        ];
    }

    // Next, match special schedules
    const specialSchedules = schoolYearObject.specialSchedules ?? {};
    for (const specialScheduleObject of Object.values(specialSchedules)) {
      if (compareDateStrings(specialScheduleObject.date, dateString) === 0)
        return [
          specialScheduleObject.schedule,
          {
            matched: "specialSchedule",
            schoolYear: schoolYearObject,
            attachment: specialScheduleObject,
          },
        ];
    }

    // TODO: Matching Rules

    // Match default week
    const defaultWeekObject = schoolYearObject.defaultWeek ?? {},
      dayOfWeek = DAYS_OF_WEEK[stringToDate(dateString).getDay()];
    return [
      defaultWeekObject[dayOfWeek] ?? null,
      {
        matched: "defaultWeek",
        schoolYear: schoolYearObject,
        attachment: defaultWeekObject,
      },
    ];
  },
  getScheduleForDateComponent = (configuration, dateComponents) =>
    getScheduleForDateString(configuration, componentsToString(dateComponents)),
  // configuration
  // school year
  //  bounds
  //  default week
  //  matching rules
  //    exceptions
  //  special schedules
  //  breaks

  saveConfiguration = (instanceRef, configurationObject) =>
    db.set(
      db.child(instanceRef, `/configurations${CONFIGURATION_INTERSTITIAL}`),
      configurationObject,
    ),
  getConfiguration = (instanceRef) =>
    new Promise((resolve, reject) =>
      db
        .get(
          db.child(instanceRef, `/configurations${CONFIGURATION_INTERSTITIAL}`),
        )
        .then((configurationObjectSnapshot) =>
          resolve(configurationObjectSnapshot.val()),
        )
        .catch(reject),
    ),
  generateNewConfigurationKey = (instanceRef, schoolYear, kind) =>
    db.push(
      db.child(
        instanceRef,
        `/configurations${CONFIGURATION_INTERSTITIAL}/schoolYears/${schoolYear}/${kind}`,
      ),
    ).key;
