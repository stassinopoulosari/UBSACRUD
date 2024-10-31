const timeStringFormat = /^[0-2][0-9]:[0-5][0-9]$/;

export const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
  MONTHS_OF_YEAR = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ],
  isValidDateString = (dateString) =>
    typeof dateString === "string" &&
    dateString.split("-").length === 3 &&
    dateString.split("-").every((str, i) => str.length === [4, 2, 2][i]),
  stringToMonth = (dateString) => {
    if (!isValidDateString(dateString))
      throw `DateFormatException(${dateString})`;
    return dateString.split("-").slice(0, 2).join("-");
  },
  isValidDateComponents = (components) =>
    Array.isArray(components) &&
    components.every((component) => typeof component == "number") &&
    components.every(
      (component, i) =>
        component > 0 &&
        component < [9999, 13, 32][i] &&
        Number.isInteger(component),
    ),
  compareDateComponents = (dateComponent0, dateComponent1) => {
    if (
      !isValidDateComponents(dateComponent0) ||
      !isValidDateComponents(dateComponent1)
    )
      throw `DateFormatException(${dateComponent0},${dateComponent1})`;

    if (dateComponent0.every((component, i) => component === dateComponent1[i]))
      return 0;
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      if (dateComponent0[componentIndex] !== dateComponent1[componentIndex])
        return dateComponent0[componentIndex] < dateComponent1[componentIndex]
          ? -1
          : 1;
    }
    // This should be unreachable
  },
  compareDateStrings = (dateString0, dateString1) =>
    compareDateComponents(toComponents(dateString0), toComponents(dateString1)),
  toComponents = (dateString) => {
    if (!isValidDateString(dateString))
      throw `DateFormatException(${dateString})`;
    return dateString.split("-").map((component) => parseInt(component));
  },
  componentsToString = (dateComponents) => {
    if (!isValidDateComponents(dateComponents))
      throw `DateFormatException(${dateComponents})`;

    return dateComponents
      .map((component, i) => String(component).padStart([4, 2, 2][i], 0))
      .join("-");
  },
  onInterval = (dateComponents, intervalComponents, closed) =>
    (compareDateComponents(dateComponents, intervalComponents[0]) === 1 ||
      (closed &&
        compareDateComponents(dateComponents, intervalComponents[0]) === 0)) &&
    (compareDateComponents(dateComponents, intervalComponents[1]) === -1 ||
      (closed &&
        compareDateComponents(dateComponents, intervalComponents[1]) === 0)),
  hasOverlap = (intervalComponents0, intervalComponents1, closed) =>
    onInterval(intervalComponents0[0], intervalComponents1, closed) ||
    onInterval(intervalComponents0[1], intervalComponents1, closed) ||
    onInterval(intervalComponents1[0], intervalComponents0, closed) ||
    onInterval(intervalComponents1[1], intervalComponents0, closed),
  stringHasOverlap = (dateInterval0, dateInterval1, closed) =>
    hasOverlap(
      dateInterval0.map((dateString) => toComponents(dateString)),
      dateInterval1.map((dateString) => toComponents(dateString)),
      closed,
    ),
  stringOnInterval = (dateString, dateInterval, closed) =>
    onInterval(
      toComponents(dateString),
      dateInterval.map((dateString) => toComponents(dateString)),
      closed,
    ),
  stringToDate = (dateString) => componentsToDate(toComponents(dateString)),
  stringIntervalToComponentInterval = (dateInterval) =>
    dateInterval.map((dateString) => toComponents(dateString)),
  componentsToDate = (dateComponents) => {
    const date = new Date(0);
    date.setYear(dateComponents[0]);
    date.setMonth(dateComponents[1] - 1, dateComponents[2]);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  },
  dateToString = (date) => componentsToString(dateToComponents(date)),
  dateToComponents = (date) => [
    date.getYear() + 1900,
    date.getMonth() + 1,
    date.getDate(),
  ],
  isValidTimeString = (ts) => timeStringFormat.test(ts),
  compareTimeStrings = (ts0, ts1) => {
    if (!timeStringFormat.test(ts0) || !timeStringFormat.test(ts1))
      throw "invalid time string";

    const ts0Components = ts0
        .split(":")
        .map((component) => parseInt(component)),
      ts1Components = ts1.split(":").map((component) => parseInt(component));

    return ts0Components[0] > ts1Components[0]
      ? -1
      : ts0Components[0] < ts1Components[0]
        ? 1
        : ts0Components[1] > ts1Components[1]
          ? -1
          : ts0Components[1] < ts1Components[1]
            ? 1
            : 0;
  },
  everyDateComponentOnInterval = (intervalComponents, closed) => {
    const runningDate = componentsToDate(intervalComponents[0]);
    const everyDateComponent = [];
    while (
      onInterval(dateToComponents(runningDate), intervalComponents, closed)
    ) {
      everyDateComponent.push(dateToComponents(runningDate));
      runningDate.setDate(runningDate.getDate() + 1);
    }
    return everyDateComponent;
  },
  everyDateStringOnInterval = (dateInterval, closed) => {
    const runningDate = stringToDate(intervalComponents[0]);
    const everyDateString = [];
    while (stringOnInterval(dateToString(runningDate), dateInterval, closed)) {
      everyDateString.push(dateToString(runningDate));
      runningDate.setDate(runningDate.getDate() + 1);
    }
    return everyDateString;
  },
  daysInMonth = (dateComponents) => {
    const firstDayOfMonth = dateComponents.slice(0, 2).concat([1]);
    const date = componentsToDate(firstDayOfMonth);
    date.setDate(32);
    date.setDate(0);
    return date.getDate();
  };
