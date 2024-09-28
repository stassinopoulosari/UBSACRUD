import * as ui from "../../shared/ui.js";
import {
  componentsToDate,
  MONTHS_OF_YEAR,
  toComponents,
  dateToString,
} from "../../api/dateUtils.js";
import { getScheduleForDateString, MATCHES } from "../../api/configuration.js";

const NUM_WEEKS = 6,
  DAYS_PER_WEEK = 7;

const $page = ui.make$Page({
    calendarMonth: "calendar-header-month",
    prevMonth: "calendar-header-prev",
    nextMonth: "calendar-header-next",
    calendarContent: "calendar-content",
    mobileCalendar: "mobile-calendar-content",
  }),
  currentDate = new Date();

let currentMonth = dateToString(currentDate).split("-").slice(0, 2).join("-");

export let navigateToMonth = (month, configuration, schedules) => {
  currentMonth = month;
  renderCalendarView(configuration, schedules);
};

export const renderCalendarView = (configuration, schedules) => {
    const scheduleTitles = {};
    for (const scheduleKey in schedules) {
      scheduleTitles[scheduleKey] =
        schedules[scheduleKey].name ?? "Untitled Schedule";
    }
    renderCalendar(currentMonth, configuration, scheduleTitles);
  },
  createCalendar = (iterator) => {
    $page.calendarContent.innerText = "";
    $page.mobileCalendar.innerText = "";
    for (let weekIndex = 0; weekIndex < NUM_WEEKS; weekIndex++) {
      const $weekElement = ui.classes(ui.make("div"), ["calendar-week"]);
      for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex++) {
        const $dayElement = ui.classes(ui.make("div"), ["calendar-day"]);
        $weekElement.appendChild($dayElement);
        if (iterator !== undefined && typeof iterator === "function")
          iterator($dayElement, dayIndex);
      }
      $page.calendarContent.appendChild($weekElement);
    }
  },
  renderCalendar = (month, configuration, scheduleTitles) => {
    // Month is string in the form YYYY-MM
    currentMonth = month;
    let hasStarted = false,
      hasEnded = false;

    const firstDay = `${month}-01`,
      firstDayComponents = toComponents(firstDay),
      monthNumber = firstDayComponents[1],
      firstDayDate = componentsToDate(firstDayComponents),
      firstDayDayOfWeek = firstDayDate.getDay(),
      runningDate = componentsToDate(firstDayComponents),
      prevMonthLastDate = componentsToDate(firstDayComponents),
      nextMonthFirstDate = componentsToDate(firstDayComponents);
    prevMonthLastDate.setDate(0);
    nextMonthFirstDate.setDate(32);
    nextMonthFirstDate.setDate(1);
    const nextMonthDateString = dateToString(nextMonthFirstDate)
        .split("-")
        .slice(0, 2)
        .join("-"),
      prevMonthDateString = dateToString(prevMonthLastDate)
        .split("-")
        .slice(0, 2)
        .join("-");
    $page.prevMonth.onclick = () =>
      renderCalendar(prevMonthDateString, configuration, scheduleTitles);
    $page.nextMonth.onclick = () =>
      renderCalendar(nextMonthDateString, configuration, scheduleTitles);
    createCalendar(($dayElement, dayIndex) => {
      if (hasEnded || (!hasStarted && dayIndex < firstDayDayOfWeek)) {
        return;
      } else if (!hasStarted) {
        hasStarted = true;
        $page.calendarMonth.innerText = `${MONTHS_OF_YEAR[monthNumber - 1]} ${firstDayComponents[0]}`;
        $page.mobileCalendar.appendChild(
          ui.children(
            ui.classes(ui.make("div"), ["mobile-calendar-controls"]),
            [
              ui.update(ui.make("button"), {
                innerText: "< prev",
                onclick: $page.prevMonth.onclick,
              }),
              ui.update(ui.make("b"), {
                innerText: `${MONTHS_OF_YEAR[monthNumber - 1]} ${firstDayComponents[0]}`,
              }),
              ui.update(ui.make("button"), {
                innerText: "next >",
                onclick: $page.nextMonth.onclick,
              }),
            ],
          ),
        );
      } else if (runningDate.getMonth() !== monthNumber - 1) {
        hasEnded = true;
        return;
      }
      const dayOfMonth = runningDate.getDate(),
        dateString = dateToString(runningDate),
        scheduleForDay = getScheduleForDateString(configuration, dateString),
        matchesSchedule = scheduleForDay[0] !== null,
        scheduleTitle = matchesSchedule
          ? scheduleTitles[scheduleForDay[0]] ?? "Untitled Schedule"
          : null,
        $mobileCalendarDay = ui.classes(
          ui.update(ui.make("div"), {
            innerText: `${dateString} - ${matchesSchedule ? scheduleTitle : "No schedule"}`,
          }),
          ["mobile-calendar-day"],
        ),
        $attributionElement = ui.classes(
          ui.update(ui.make("div"), {
            innerHTML: `${matchesSchedule ? scheduleTitle + "<br>" : ""}${MATCHES[scheduleForDay[1].matched]}`,
          }),
          ["calendar-attribution"],
        );
      $dayElement.innerText = dayOfMonth;
      $dayElement.appendChild($attributionElement);
      $page.mobileCalendar.appendChild($mobileCalendarDay);
      $dayElement.onmouseover = () =>
        ($attributionElement.style.display = "block");
      $dayElement.onmouseout = () =>
        ($attributionElement.style.display = "none");
      ui.classes($dayElement, [
        `calendar-day-match-${scheduleForDay[1].matched}`,
        matchesSchedule ? "calendar-day-matched" : "calendar-day-no-schedule",
      ]);
      ui.classes($mobileCalendarDay, [
        `calendar-day-match-${scheduleForDay[1].matched}`,
        matchesSchedule ? "calendar-day-matched" : "calendar-day-no-schedule",
      ]);
      runningDate.setDate(runningDate.getDate() + 1);
    });
  };
