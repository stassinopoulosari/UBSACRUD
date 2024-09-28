import * as ui from "../../shared/ui.js";
import {
  deleteSymbol,
  getSymbols,
  setSymbolDefaultValue,
  setSymbolIsConfigurable,
} from "../../api/symbols.js";
import { getInstance } from "../../shared/userUtil.js";
import { Tasker } from "../../shared/tasker.js";
import { symbolExistsInSchedules } from "../../api/schedule.js";

const $symbolsList = ui.find("symbols-list"),
  $symbolsThinking = ui.find("symbols-thinking"),
  symbolsTasker = new Tasker(
    (breakdown) => {
      if (
        breakdown.inProgress === 0 &&
        breakdown.completed === 0 &&
        breakdown.failed === 0
      ) {
        $symbolsThinking.innerHTML = `&nbsp;`;
        return;
      }
      $symbolsThinking.innerText = `${breakdown.completed} task completed, ${breakdown.failed} failed, ${breakdown.inProgress} in progress.`;
      if (breakdown.inProgress > 0) {
        ui.addEllipsis($symbolsThinking);
      } else {
        ui.removeEllipsis($symbolsThinking);
      }
    },
    { autoReset: 3000 },
  );

getInstance("../../login").then((instanceRef) => {
  getSymbols(instanceRef).then((symbols) => {
    $symbolsList.innerText = "";
    for (const symbolKey in symbols) {
      const symbol = symbols[symbolKey];
      let cachedSymbol = symbol;
      const $symbol = ui.data(ui.classes(ui.make("div"), ["symbol-row"]), {
          key: symbolKey,
          modified: false,
        }),
        $symbolValue = ui.data(
          ui.update(ui.make("input"), {
            type: "text",
            title: "default value",
            value: symbol.value,
          }),
          { cachedValue: symbol.value },
        ),
        $symbolConfigurable = ui.data(
          ui.update(ui.make("input"), {
            type: "checkbox",
            checked: symbol.configurable,
            title: "configurable",
          }),
          { cachedValue: symbol.configurable },
        ),
        $symbolSaveButton = ui.style(
          ui.update(ui.make("button"), {
            innerText: "💾",
            title: "save",
          }),
          { visibility: "hidden" },
        ),
        $symbolDeleteButton = ui.update(ui.make("button"), {
          innerText: "🗑️",
          title: "delete",
        });
      const generateSymbol = () => ({
          value: $symbolValue.value,
          configurable: $symbolConfigurable.checked,
        }),
        onUpdate = () => {
          const generatedSymbol = generateSymbol();
          if (
            cachedSymbol.value !== generatedSymbol.value ||
            cachedSymbol.configurable !== generatedSymbol.configurable
          ) {
            $symbolSaveButton.style.visibility = "visible";
          } else {
            $symbolSaveButton.style.visibility = "hidden";
          }
        },
        onDelete = () => {
          const $symbolDeleteError = ui.find("symbols-delete-error");
          $symbolDeleteButton.disabled = true;
          const resetButton = () => {
            return setTimeout(() => {
              $symbolDeleteButton.disabled = false;
              $symbolDeleteButton.title = "delete";
            }, 3000);
          };
          symbolsTasker.addTask(
            new Promise((resolve, reject) =>
              symbolExistsInSchedules(instanceRef, symbolKey)
                .then((symbolExists) => {
                  if (symbolExists) {
                    $symbolDeleteButton.title = $symbolDeleteError.innerText =
                      "Symbol exists in at least one schedule. Could not delete.";
                    reject();
                    resetButton();
                  }
                  deleteSymbol(instanceRef, symbolKey)
                    .then(() => {
                      $symbol.remove();
                      resolve();
                    })
                    .catch(() => {
                      $symbolDeleteButton.title = $symbolDeleteError.innerText =
                        "Unable to delete symbol.";
                      reject();
                      resetButton();
                    });
                })
                .catch((error) => {
                  console.error(error);
                  $symbolDeleteButton.title = $symbolDeleteError.innerText =
                    "Unable to check if symbol exists in schedules.";
                  reject();
                  resetButton();
                }),
            ),
          );
        },
        onSave = () => {
          const generatedSymbol = generateSymbol(),
            valuePromise = setSymbolDefaultValue(
              instanceRef,
              symbolKey,
              generatedSymbol.value,
            ),
            configurablePromise = setSymbolIsConfigurable(
              instanceRef,
              symbolKey,
              generatedSymbol.configurable,
            );
          symbolsTasker.addTask(valuePromise);
          symbolsTasker.addTask(configurablePromise);
          Promise.all([valuePromise, configurablePromise]).then(() => {
            cachedSymbol = generatedSymbol;
            onUpdate();
          });
        };
      $symbolValue.onkeyup = onUpdate;
      $symbolConfigurable.onchange = onUpdate;
      $symbolSaveButton.onclick = onSave;
      $symbolDeleteButton.onclick = onDelete;
      $symbolsList.appendChild($symbol);
      $symbol.appendChild($symbolValue);
      $symbol.appendChild($symbolConfigurable);
      $symbol.appendChild($symbolSaveButton);
      $symbol.appendChild($symbolDeleteButton);
    }
  });
});
