import { createSchedule, hideSchedule } from "../../api/schedule.js";
import * as ui from "../../shared/ui.js";

const $page = ui.make$Page({
  schedulesList: "schedules-list",
  scheduleNameHeader: "schedules-header",
  schedulesThinking: "schedules-thinking",
});

export const setupAllSchedulesView = (instanceRef, schedules) => {
    $page.scheduleNameHeader.innerText = "schedules";
    $page.schedulesList.innerText = "";
    Object.keys(schedules)
      .sort((keyA, keyB) =>
        [schedules[keyA], schedules[keyB]]
          .map((schedule) => schedule.name)
          .sort()
          .indexOf(schedules[keyA].name) === 0
          ? -1
          : 1,
      )
      .forEach((scheduleKey) =>
        $page.schedulesList.appendChild(
          createScheduleElement(
            instanceRef,
            schedules[scheduleKey],
            scheduleKey,
          ),
        ),
      );
    const $addScheduleRow = ui.classes(ui.make("div"), [
      "schedules-list-schedule",
    ]);
    $addScheduleRow.appendChild(
      ui.update(ui.make("button"), {
        innerText: "+ create schedule",
        onclick: () => {
          ui.addEllipsis(
            ui.update($page.schedulesThinking, {
              innerText: "creating schedule",
            }),
          );

          createSchedule(instanceRef).then((key) =>
            location.assign(`?schedule=${key}`),
          );
        },
      }),
    );
    $page.schedulesList.appendChild($addScheduleRow);
  },
  createScheduleElement = (instanceRef, schedule, scheduleKey) => {
    const name = schedule.name;
    const $scheduleElement = ui.classes(ui.make("div"), [
        "schedules-list-schedule",
      ]),
      $scheduleName = ui.update(
        ui.classes(ui.make("span"), ["schedules-list-schedule-name"]),
        { innerText: name },
      ),
      $editScheduleLink = ui.update(ui.classes(ui.make("a"), ["button"]), {
        href: "./?schedule=" + scheduleKey,
        innerText: "edit",
      }),
      $deleteScheduleButton = ui.update(ui.make("button"), {
        innerText: "🗑️",
        onclick: () =>
          (confirm(
            `are you sure you would like to delete schedule "${name}"? this cannot be undone`,
          )
            ? () => {
                ui.addEllipsis(
                  ui.update($page.schedulesThinking, {
                    innerText: "deleting schedule",
                  }),
                );

                hideSchedule(instanceRef, scheduleKey).then(() => {
                  $scheduleElement.remove();
                  ui.update($page.schedulesThinking, {
                    innerText: "schedule deleted.",
                  });
                });
              }
            : () => {})(),
      });
    document.getElementsByTagName("body")[0].classList.add("center-content");
    $scheduleElement.appendChild($scheduleName);
    $scheduleElement.appendChild($editScheduleLink);
    $scheduleElement.appendChild($deleteScheduleButton);
    return $scheduleElement;
  };
