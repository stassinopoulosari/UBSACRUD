import { renameSchedule, savePeriods } from "../../api/schedule.js";
import {
  createSymbolWithKey,
  getNewSymbolKey,
  stringToSymbolValueList,
} from "../../api/symbols.js";
import { TagManager } from "../../shared/tagManager.js";
import * as ui from "../../shared/ui.js";
import { compareTimeStrings, isValidTimeString } from "../../api/dateUtils.js";

const $page = ui.make$Page({
  schedulesList: "schedules-list",
  schedulesThinking: "schedules-thinking",
  scheduleName: "schedule-name",
  scheduleNameEditContainer: "edit-schedule-name",
  scheduleNameEditInput: "edit-schedule-name-input",
  scheduleNameEditSave: "edit-schedule-name-save",
  scheduleNameEditCancel: "edit-schedule-name-cancel",
  scheduleBackLink: "schedules-back-link",
  scheduleControlsTop: "schedule-controls-top",
  scheduleControlsBottom: "schedule-controls-bottom",
  scheduleSave: "schedule-save",
  scheduleInsertEnd: "schedule-insert-end",
  scheduleInsertBeginning: "schedule-insert-beginning",
});

const INVALID_START_END = "invalid_start_end",
  INVALID_TAG_MANAGER = "invalid_tag_manager",
  PERIOD_OUT_OF_ORDER = "period_out_of_order";

export const setupScheduleView = (
  instanceRef,
  symbols,
  invertedSymbols,
  scheduleKey,
  schedule,
) => {
  $page.scheduleBackLink.href = ".";
  [$page.scheduleControlsTop, $page.scheduleControlsBottom].forEach(($el) =>
    ui.style($el, { display: "block" }),
  );
  $page.scheduleName.onclick = () => {
    ui.style($page.scheduleNameEditContainer, { display: "inline" });
    ui.style($page.scheduleName, { display: "none" });
    $page.scheduleNameEditInput.focus();
  };
  $page.scheduleName.innerText = $page.scheduleNameEditInput.value =
    schedule.name;
  $page.scheduleNameEditInput.onkeydown = (e) => {
    if (e.key === "Enter") $page.scheduleNameEditSave.onclick();
    if (e.key === "Escape") $page.scheduleNameEditCancel.onclick();
  };
  $page.scheduleNameEditSave.onclick = () => {
    const newScheduleName = $page.scheduleNameEditInput.value;
    $page.scheduleNameEditInput.disabled = true;
    $page.scheduleNameEditSave.disabled = true;
    $page.scheduleNameEditCancel.disabled = true;
    if (newScheduleName.trim() === "") {
      setTimeout(() => {
        $page.scheduleNameEditSave.disabled = false;
      }, 3000);
      $page.scheduleNameEditInput.disabled = false;
      $page.scheduleNameEditCancel.disabled = false;
      return false;
    }
    renameSchedule(instanceRef, scheduleKey, newScheduleName).then(() => {
      $page.scheduleNameEditSave.disabled = false;
      $page.scheduleNameEditInput.disabled = false;
      $page.scheduleNameEditCancel.disabled = false;
      ui.style($page.scheduleNameEditContainer, { display: "none" });
      ui.update(
        ui.style($page.scheduleName, {
          display: "inline",
        }),
        { innerText: newScheduleName },
      );
    });
  };
  $page.scheduleNameEditCancel.onclick = () => {
    $page.scheduleNameEditInput.value = $page.scheduleName.innerText;
    ui.style($page.scheduleNameEditContainer, { display: "none" });
    ui.style($page.scheduleName, { display: "inline" });
  };
  $page.scheduleInsertBeginning.onclick = () => {
    ui.style($page.scheduleInsertEnd, { visibility: "visible" });
    let end = "";
    if ($page.schedulesList.children.length !== 0) {
      end = $page.schedulesList.children[0].querySelector(
        ".schedule-period-start-time",
      ).value;
    }
    ($page.schedulesList.children.length !== 0
      ? ($el) =>
          $page.schedulesList.insertBefore($el, $page.schedulesList.children[0])
      : ($el) => $page.schedulesList.appendChild($el))(
      createPeriodElement(
        { name: "", start: "", end: end },
        symbols,
        periodContext,
      ),
    );
    periodContext.modifiedPeriods.add(crypto.randomUUID());
  };
  $page.scheduleSave.onclick = () => {
    if (checkValidity()[0]) {
      $page.scheduleSave.disabled = true;
      savePeriods(
        instanceRef,
        scheduleKey,
        [].map.call($page.schedulesList.children, ($periodElement) => {
          const uuid = $periodElement.dataset.uuid,
            generatePeriod = periodContext.generatePeriodFunctions[uuid];
          return generatePeriod();
        }),
      )
        .then(() => {
          $page.schedulesThinking.innerText = "saved successfully.";
          setTimeout(() => {
            $page.schedulesThinking.innerHTML = "&nbsp;";
          }, 3000);
          $page.scheduleSave.disabled = false;
          $page.scheduleSave.style.visibility = "hidden";
          periodContext.modifiedPeriods.set = new Set();
          periodContext.modifiedPeriods.onchange(
            periodContext.modifiedPeriods.set,
          );
          Object.values(periodContext.resetCacheFunctions).forEach(
            (resetCache) => resetCache(),
          );
        })
        .catch((error) => {
          console.log(error);
          $page.schedulesThinking.innerText = "did not save successfully.";
        });
    } else {
      complain(true);
    }
  };
  $page.scheduleSave.onmouseover = () => {
    complain(false);
  };
  $page.scheduleSave.onmouseout = () => {
    uncomplain();
  };

  const uncomplain = () => {
      [].forEach.call(
        $page.schedulesList.querySelectorAll('input[type="time"]'),
        ($el) => {
          $el.style.backgroundColor = null;
          $el.style.color = null;
        },
      );
    },
    complain = (temporary) => {
      const attribution = checkValidity()[1];
      if (attribution === null) return;

      const $attributedPeriod = $page.schedulesList.querySelector(
        `.schedule-period[data-uuid="${attribution.uuid}"]`,
      );

      switch (attribution.message) {
        case INVALID_START_END:
          [].forEach.call(
            $attributedPeriod.querySelectorAll('input[type="time"]'),
            ($el) => {
              $el.style.backgroundColor = "#C1292E";
              $el.style.color = "#FFF";
              if (temporary)
                setTimeout(() => {
                  $el.style.backgroundColor = null;
                  $el.style.color = null;
                }, 3000);
            },
          );
          break;
        case INVALID_TAG_MANAGER:
          alert("Invalid tag manager");
          break;
        case PERIOD_OUT_OF_ORDER:
          $attributedPeriod.querySelector(
            'input[type="time"]',
          ).style.backgroundColor = "red";
          if (temporary)
            setTimeout(() => {
              $attributedPeriod.querySelector(
                'input[type="time"]',
              ).style.backgroundColor = null;
            }, 3000);
        default:
          break;
      }
    };
  $page.scheduleInsertEnd.onclick = () => {
    ui.style($page.scheduleInsertEnd, { visibility: "visible" });
    let start = "";
    if ($page.schedulesList.children.length !== 0) {
      start = [].slice
        .call($page.schedulesList.children, -1)[0]
        .querySelector(".schedule-period-end-time").value;
    }
    $page.schedulesList.appendChild(
      createPeriodElement(
        { name: "", start: start, end: "" },
        symbols,
        periodContext,
      ),
    );
    periodContext.modifiedPeriods.add(crypto.randomUUID());
  };

  // Set up Tag Manager
  TagManager.invertedSymbols = invertedSymbols;
  TagManager.getNewSymbolKey = () => getNewSymbolKey(instanceRef);
  TagManager.datalistID = "schedules-datalist";
  TagManager.exportNewSymbol = (symbolKey, symbolValue) => {
    createSymbolWithKey(instanceRef, symbolKey, symbolValue);
  };
  // Read schedule periods
  const periodKeys = Object.keys(schedule)
      .filter((key) => !["hidden", "name"].includes(key))
      .sort(),
    periods = periodKeys.map((periodKey) => schedule[periodKey]),
    periodContext = {
      // updatePeriod: (index, name, start, end) => {},
      deletePeriod: (index) => {
        const $periodElement = $page.schedulesList.children[index],
          uuid = $periodElement.dataset.uuid;
        $periodElement.remove();
        periodContext.modifiedPeriods.add(uuid);
        delete periodContext.checkForUpdatesFunctions[uuid];
        delete periodContext.generatePeriodFunctions[uuid];
        delete periodContext.resetCacheFunctions[uuid];
        if ($page.schedulesList.children.length === 0) {
          ui.style($page.scheduleInsertEnd, { visibility: "hidden" });
        }
      },
      insertPeriodAfter: (index) => {
        const $referencePeriod = $page.schedulesList.children[index + 1],
          $prevPeriod = $page.schedulesList.children[index],
          prevEnd = $prevPeriod.querySelector(
            ".schedule-period-end-time",
          ).value,
          nextStart = $referencePeriod.querySelector(
            ".schedule-period-start-time",
          ).value;
        $page.schedulesList.insertBefore(
          createPeriodElement(
            {
              name: "",
              start: prevEnd,
              end: nextStart,
            },
            symbols,
            periodContext,
          ),
          $referencePeriod,
        );
        periodContext.checkForUpdatesFunctions[$prevPeriod.dataset.uuid]();
        periodContext.modifiedPeriods.add(crypto.randomUUID());
      },
      modifiedPeriods: {
        set: new Set(),
        add: (uuid) => {
          periodContext.modifiedPeriods.set.add(uuid);
          periodContext.modifiedPeriods.onchange(
            periodContext.modifiedPeriods.set,
          );
        },
        delete: (uuid) => {
          periodContext.modifiedPeriods.set.delete(uuid);
          periodContext.modifiedPeriods.onchange(
            periodContext.modifiedPeriods.set,
          );
        },
        onchange: (set) => {
          if (set.size > 0) {
            ui.style($page.scheduleSave, { visibility: "visible" });
          } else {
            ui.style($page.scheduleSave, { visibility: "hidden" });
          }
          if (!checkValidity()[0]) {
            $page.scheduleSave.disabled = true;
          } else {
            $page.scheduleSave.disabled = false;
          }
        },
      },
      checkForUpdatesFunctions: {},
      generatePeriodFunctions: {},
      resetCacheFunctions: {},
    };
  $page.schedulesList.innerText = "";
  periods.forEach((period) => {
    $page.schedulesList.appendChild(
      createPeriodElement(period, symbols, periodContext),
    );
  });
  if ($page.schedulesList.children.length === 0) {
    ui.style($page.scheduleInsertEnd, { visibility: "hidden" });
  } else {
    ui.style($page.scheduleInsertEnd, { visibility: "visible" });
  }
};
const checkValidity = () => {
    let prevEnd = undefined,
      flag = false,
      attribution = undefined;
    [].forEach.call($page.schedulesList.children, ($periodElement, index) => {
      if (flag === true) return;
      const start = $periodElement.querySelector(
          ".schedule-period-start-time",
        ).value,
        end = $periodElement.querySelector(".schedule-period-end-time").value,
        tagManager =
          TagManager.tagManagers[
            $periodElement.querySelector(".tag-view").dataset.tagManager
          ];
      if ([start, end].some((ts) => !isValidTimeString(ts))) {
        attribution = {
          uuid: $periodElement.dataset.uuid,
          message: INVALID_START_END,
        };
        flag = true;
        return;
      }
      if (tagManager === undefined) {
        attribution = {
          uuid: $periodElement.dataset.uuid,
          message: INVALID_TAG_MANAGER,
        };
        flag = true;
        return;
      }
      if (index > 0 && compareTimeStrings(prevEnd, start) === -1) {
        attribution = {
          uuid: $periodElement.dataset.uuid,
          message: PERIOD_OUT_OF_ORDER,
        };
        flag = true;
        return;
      }
      prevEnd = end;
    });
    if (flag) return [false, attribution];
    return [true, null];
  },
  createPeriodElement = (period, symbols, periodContext) => {
    let cachedValue = {
      name: period.name,
      start: period.start,
      end: period.end,
    };
    const uuid = crypto.randomUUID(),
      getIndex = () =>
        [].indexOf.call($periodElement.parentElement.children, $periodElement),
      $periodElement = ui.data(
        ui.classes(ui.make("div"), ["schedule-period"]),
        { uuid: uuid },
      ),
      $tagView = ui.make("div"),
      tagManager = TagManager.getTagManagerForTagView(
        $tagView,
        stringToSymbolValueList(symbols, period.name),
      ),
      $start = ui.classes(
        ui.update(ui.make("input"), {
          type: "time",
          value: period.start,
          onkeyup: () => checkForUpdates(),
        }),
        ["schedule-period-start-time"],
      ),
      $end = ui.classes(
        ui.update(ui.make("input"), {
          type: "time",
          value: period.end,
          onkeyup: () => checkForUpdates(),
        }),
        ["schedule-period-end-time"],
      ),
      $deleteButton = ui.update(ui.make("button"), {
        innerText: "🗑️",
        onclick: () => periodContext.deletePeriod(getIndex()),
      }),
      $insertBelowButton = ui.style(
        ui.update(ui.make("button"), {
          innerText: "Insert below",
          onclick: () => periodContext.insertPeriodAfter(getIndex()),
        }),
        { visibility: "hidden" },
      ),
      generatePeriod = () => ({
        name: tagManager.asSymbolString(),
        start: $start.value,
        end: $end.value,
      }),
      resetCache = () => {
        cachedValue = generatePeriod();
      },
      checkForUpdates = (stopPropagation) => {
        const generatedPeriod = generatePeriod(),
          cachedPeriod = cachedValue,
          index = getIndex(),
          $schedulesList = $periodElement.parentElement;
        if (
          !(
            generatedPeriod.name === cachedPeriod.name &&
            generatedPeriod.start === cachedPeriod.start &&
            generatedPeriod.end === cachedPeriod.end
          )
        ) {
          periodContext.modifiedPeriods.add(uuid);
        } else {
          periodContext.modifiedPeriods.delete(uuid);
        }

        if (index < $schedulesList.children.length - 1) {
          const nextStart = $schedulesList.children[index + 1].querySelector(
              ".schedule-period-start-time",
            ).value,
            end = $end.value;
          if (
            isValidTimeString(end) &&
            isValidTimeString(nextStart) &&
            compareTimeStrings(end, nextStart) > 0
          ) {
            ui.style($insertBelowButton, { visibility: "visible" });
          } else {
            ui.style($insertBelowButton, { visibility: "hidden" });
          }
        }

        if (index > 0 && stopPropagation !== true) {
          const prevUUID = $schedulesList.children[getIndex() - 1].dataset.uuid;
          periodContext.checkForUpdatesFunctions[prevUUID](true);
        }
      };

    periodContext.checkForUpdatesFunctions[uuid] = checkForUpdates;
    periodContext.generatePeriodFunctions[uuid] = generatePeriod;
    periodContext.resetCacheFunctions[uuid] = resetCache;

    tagManager.onchange = () => checkForUpdates();

    $periodElement.appendChild($tagView);
    $periodElement.appendChild($start);
    $periodElement.appendChild($end);
    $periodElement.appendChild($deleteButton);
    $periodElement.appendChild($insertBelowButton);
    return $periodElement;
  };
