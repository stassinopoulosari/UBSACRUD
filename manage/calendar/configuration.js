import { getScheduleForDateComponent } from "../../api/configuration.js";
import {
	compareDateStrings,
	dateToString,
	DAYS_OF_WEEK,
	daysInMonth,
	everyDateComponentOnInterval,
	stringHasOverlap,
	stringIntervalToComponentInterval,
	stringOnInterval,
} from "../../api/dateUtils.js";
import * as ui from "../../shared/ui.js";

let currentSchoolYear,
	configuration,
	schedules,
	reloadCalendar,
	navigateCalendar,
	saveCalendar,
	notifyChange,
	saveConfiguration,
	generateConfigurationKey;
const $page = ui.make$Page({
	auxiliaryControls: "configuration-auxiliaryControls",
	configurationSave: "configuration-save",
	configurationPush: "configuration-push",
	configurationReplicate: "configuration-replicate",
	schoolYearHeader: "configuration-school-year-heading",
	headerError: "configuration-header-error",
	prevSchoolYear: "configuration-school-year-prev",
	nextSchoolYear: "configuration-school-year-next",
	bounds: {
		startDate: "configuration-bounds-startDate",
		endDate: "configuration-bounds-endDate",
		createSchoolYear: "configuration-bounds-create-school-year",
		error: "configuration-bounds-error",
	},
	defaultWeek: "configuration-defaultWeek",
	breaks: {
		list: "configuration-breaks",
		error: "configuration-breaks-error",
		add: {
			startDate: "configuration-addBreak-startDate",
			endDate: "configuration-addBreak-endDate",
			schedule: "configuration-addBreak-schedule",
			error: "configuration-addBreak-error",
			submit: "configuration-addBreak-add",
		},
	},
	specialSchedules: {
		list: "configuration-specialSchedules",
		error: "configuration-specialSchedules-error",
		add: {
			date: "configuration-addSpecialSchedule-date",
			schedule: "configuration-addSpecialSchedule-schedule",
			error: "configuration-addSpecialSchedule-error",
			submit: "configuration-addSpecialSchedule-add",
		},
	},
});
export const startConfigurationView = (
		remoteConfiguration,
		remoteSchedules,
		dependencies,
	) => {
		configuration = remoteConfiguration;
		schedules = remoteSchedules;
		reloadCalendar = dependencies.reloadCalendar;
		navigateCalendar = dependencies.navigateCalendar;
		generateConfigurationKey = dependencies.generateConfigurationKey;
		saveConfiguration = dependencies.saveConfiguration;
		saveCalendar = dependencies.saveCalendar;
		const year = new Date().getFullYear(),
			month = new Date().getMonth();
		currentSchoolYear = `${year - 1}-${year}`;
		if (month >= 6) currentSchoolYear = `${year}-${year + 1}`;
		renderConfiguration();
	},
	renderConfiguration = () => {
		const schoolYear = currentSchoolYear,
			firstYear = currentSchoolYear.split("-")[0],
			secondYear = currentSchoolYear.split("-")[1],
			thirdYear = parseInt(secondYear) + 1,
			zerothYear = parseInt(firstYear) - 1;
		$page.schoolYearHeader.innerText = `${firstYear}-${secondYear} school year`;
		$page.prevSchoolYear.onclick = () => {
			currentSchoolYear = `${zerothYear}-${firstYear}`;
			renderConfiguration();
		};
		$page.nextSchoolYear.onclick = () => {
			currentSchoolYear = `${secondYear}-${thirdYear}`;
			renderConfiguration();
		};
		if (configuration.lastPushed === undefined)
			configuration.lastPushed = 0;
		if (configuration.lastUpdated === undefined)
			configuration.lastUpdated = 0;

		if (configuration.lastUpdated < configuration.lastPushed) {
			$page.configurationPush.disabled = true;
		} else {
			$page.configurationPush.disabled = false;
		}

		fetch(
			`https://ubsa-replicate.ari-s.com/dublinHS.json?t=${new Date().getTime()}`,
		)
			.then((response) => {
				response.json().then((replicatedResponse) => {
					console.log("Got configuration:", replicatedResponse);
					console.log(
						"Comparing lastUpdated of calendar, replicatedResponse: ",
						configuration.lastUpdated,
						replicatedResponse.lastUpdated,
					);
					let disableReplicate = true;
					if (
						replicatedResponse.lastUpdated <
						configuration.lastUpdated
					) {
						disableReplicate = null;
					}
					ui.attr($page.configurationReplicate, {
						disabled: disableReplicate,
					});
				});
			})
			.catch((err) => {
				console.error(err);
			});

		notifyChange = () => {
			$page.configurationSave.disabled = false;
			$page.configurationPush.disabled = true;
		};

		$page.configurationSave.onclick = () => {
			configuration.lastUpdated = Math.floor(new Date().getTime() / 1000);
			saveConfiguration(configuration)
				.then(() => {
					$page.configurationSave.disabled = true;
					$page.configurationPush.disabled = false;
					$page.headerError.innerHTML = "&nbsp;";
				})
				.catch(() => {
					$page.headerError.innerText =
						"failed to save configuration.";
				});
		};

		$page.configurationPush.onclick = () => {
			// generate the calendar for every school year
			const calendar = {};
			Object.values(configuration.schoolYears).forEach((schoolYear) => {
				const bounds = schoolYear.bounds,
					everyDateComponent = everyDateComponentOnInterval(
						stringIntervalToComponentInterval([
							bounds.startDate,
							bounds.endDate,
						]),
						true,
					),
					dateComponentSchedulePairs = everyDateComponent.map(
						(dateComponent) => [
							dateComponent,
							getScheduleForDateComponent(
								configuration,
								dateComponent,
							)[0] ?? "",
						],
					);
				// Remove past school years
				if (
					compareDateStrings(
						bounds.endDate,
						dateToString(new Date()),
					) < 0
				)
					return;
				dateComponentSchedulePairs.forEach((pair) => {
					const [dateComponent, schedule] = pair;
					let [year, month, date] = dateComponent;
					month = month.toString().padStart(2, "0");
					if (calendar[year] === undefined) calendar[year] = {};
					if (calendar[year][month] === undefined)
						calendar[year][month] = {};
					calendar[year][month][date] = schedule;
				});
			});
			for (const yearKey in calendar) {
				for (const monthKey in calendar[yearKey]) {
					const components = [
						parseInt(yearKey),
						parseInt(monthKey),
						1,
					];
					const monthSchedules = Array(daysInMonth(components) + 1)
						.fill("")
						.map((_, i) => {
							return calendar[yearKey][monthKey][i] ?? "";
						});
					calendar[yearKey][monthKey] = monthSchedules.join(",");
				}
			}
			const lastPushed = Math.floor(new Date().getTime() / 1000);
			saveCalendar(calendar, lastPushed)
				.then(() => {
					configuration.lastPushed = lastPushed;
					saveConfiguration(configuration).catch(() => {
						$page.headerError.innerText =
							"failed to save configuration.";
					});
					$page.configurationPush.disabled = true;
					ui.attr($page.configurationReplicate, { disabled: null });
					$page.headerError.innerHTML = "&nbsp;";
				})
				.catch(() => {
					$page.headerError.innerText =
						"failed to push configuration to the calendar.";
				});
		};

		if (configuration.schoolYears === undefined)
			configuration.schoolYears = {};
		if (configuration.schoolYears[schoolYear] === undefined) {
			// configuration.schoolYears[schoolYear] = {};
			renderBounds(undefined, true);
			hideAuxiliaryControls();
		} else {
			let schoolYearConfiguration = configuration.schoolYears[schoolYear];
			renderBounds(schoolYearConfiguration.bounds);
			renderDefaultWeek(schoolYearConfiguration.defaultWeek);
			renderBreaks(schoolYearConfiguration.breaks);
			renderSpecialSchedules(schoolYearConfiguration.specialSchedules);
			showAuxiliaryControls();
		}
	},
	renderBounds = (bounds, isNewSchoolYear) => {
		if (isNewSchoolYear) {
			ui.style(
				ui.update($page.bounds.createSchoolYear, { disabled: true }),
				{
					display: "block",
				},
			);
		} else {
			ui.style($page.bounds.createSchoolYear, { display: "none" });
		}
		$page.bounds.startDate.onkeyup = $page.bounds.endDate.onkeyup = () => {
			if (
				$page.bounds.startDate.value !== "" &&
				$page.bounds.endDate.value !== "" &&
				compareDateStrings(
					$page.bounds.startDate.value,
					$page.bounds.endDate.value,
				) < 0
			) {
				if (isNewSchoolYear) {
					ui.update($page.bounds.createSchoolYear, {
						disabled: false,
					});
				} else {
					const schoolYears = configuration.schoolYears;
					if (
						Object.keys(schoolYears).every(
							(schoolYearKey) =>
								schoolYearKey === currentSchoolYear ||
								!stringHasOverlap(
									[
										schoolYears[schoolYearKey].bounds
											.startDate,
										schoolYears[schoolYearKey].bounds
											.endDate,
									],
									[
										$page.bounds.startDate.value,
										$page.bounds.endDate.value,
									],
								),
						)
					) {
						configuration.schoolYears[currentSchoolYear].bounds = {
							startDate: $page.bounds.startDate.value,
							endDate: $page.bounds.endDate.value,
						};
						notifyChange();
						reloadCalendar(configuration);
						$page.bounds.error.innerHTML = "&nbsp;";
					} else {
						$page.bounds.error.innerHTML =
							"bounds overlap with another school year";
					}
				}
			} else {
				if (isNewSchoolYear) {
					ui.update($page.bounds.createSchoolYear, {
						disabled: true,
					});
				}
			}
		};
		$page.bounds.createSchoolYear.onclick = () => {
			if (isNewSchoolYear) {
				if (
					$page.bounds.startDate.value !== "" &&
					$page.bounds.endDate.value !== "" &&
					compareDateStrings(
						$page.bounds.startDate.value,
						$page.bounds.endDate.value,
					) < 0
				) {
					const schoolYears = configuration.schoolYears;
					if (
						Object.keys(schoolYears).every(
							(schoolYearKey) =>
								schoolYearKey === currentSchoolYear ||
								!stringHasOverlap(
									[
										schoolYears[schoolYearKey].bounds
											.startDate,
										schoolYears[schoolYearKey].bounds
											.endDate,
									],
									[
										$page.bounds.startDate.value,
										$page.bounds.endDate.value,
									],
								),
						)
					) {
						configuration.schoolYears[currentSchoolYear] = {
							bounds: {
								startDate: $page.bounds.startDate.value,
								endDate: $page.bounds.endDate.value,
							},
							lastPushed: 0,
						};
						notifyChange();
						navigateCalendar(
							$page.bounds.startDate.value
								.split("-")
								.slice(0, 2)
								.join("-"),
							configuration,
						);
						renderConfiguration();
						$page.bounds.error.innerHTML = "&nbsp;";
					} else {
						$page.bounds.error.innerHTML =
							"bounds overlap with another school year";
					}
				} else {
					$page.bounds.error.innerHTML = "bounds are invalid";
				}
			}
		};
		$page.bounds.startDate.value = $page.bounds.startDate.value = "";
		$page.bounds.endDate.value = $page.bounds.endDate.value = "";
		if (bounds !== undefined) {
			$page.bounds.startDate.value = bounds.startDate;
			$page.bounds.endDate.value = bounds.endDate;
		}
	},
	renderDefaultWeek = (defaultWeek) => {
		$page.defaultWeek.innerText = "";
		if (defaultWeek === undefined) defaultWeek = {};
		ui.children(
			$page.defaultWeek,
			DAYS_OF_WEEK.map((day) => {
				const $scheduleSelect = ui.update(
						renderScheduleSelect(ui.make("select")),
						{
							id: `configuration-defaultWeek-${day}`,
							value: defaultWeek[day] ?? "",
						},
					),
					$saveButton = ui.style(
						ui.update(ui.make("button"), { innerText: "💾" }),
						{ visibility: "hidden" },
					);

				$scheduleSelect.onchange = () => {
					if ($scheduleSelect.value !== (defaultWeek[day] ?? "")) {
						ui.style($saveButton, { visibility: "visible" });
					} else {
						ui.style($saveButton, { visibility: "hidden" });
					}
				};

				$saveButton.onclick = () => {
					if (
						configuration.schoolYears[currentSchoolYear]
							.defaultWeek === undefined
					)
						configuration.schoolYears[
							currentSchoolYear
						].defaultWeek = {};

					configuration.schoolYears[currentSchoolYear].defaultWeek[
						day
					] =
						$scheduleSelect.value === ""
							? null
							: $scheduleSelect.value;
					notifyChange();
					$saveButton.style.visibility = "hidden";
					reloadCalendar(configuration);
				};

				return ui.children(ui.classes(ui.make("div"), ["form-group"]), [
					ui.update(ui.make("label"), {
						for: `configuration-defaultWeek-${day}`,
						innerText: day,
					}),
					ui.children(
						ui.classes(ui.make("div"), ["select-wrapper"]),
						[$scheduleSelect],
					),
					ui.separator(),
					$saveButton,
				]);
			}),
		);
	},
	renderBreak = (breakKey, breakObject) => {
		const $parent = ui.make("div");
		const $startDate = ui.update(ui.make("input"), {
				type: "date",
				value: breakObject.startDate,
			}),
			$endDate = ui.update(ui.make("input"), {
				type: "date",
				value: breakObject.endDate,
			}),
			$scheduleSelect = ui.update(
				renderScheduleSelect(ui.make("select")),
				{
					value: breakObject.defaultSchedule ?? "",
				},
			),
			$saveButton = ui.style(
				ui.update(ui.make("button"), {
					innerText: "💾",
				}),
				{ visibility: "hidden" },
			),
			$deleteButton = ui.update(ui.make("button"), {
				innerText: "🗑️",
			});
		$startDate.onkeyup =
			$endDate.onkeyup =
			$scheduleSelect.onchange =
				() => {
					if (
						$startDate.value !== "" &&
						$endDate.value !== "" &&
						compareDateStrings($startDate.value, $endDate.value) <=
							0 &&
						($startDate.value !== breakObject.startDate ||
							$endDate.value !== breakObject.endDate ||
							$scheduleSelect.value !==
								(breakObject.schedule ?? ""))
					) {
						ui.style($saveButton, { visibility: "visible" });
					} else {
						ui.style($saveButton, { visibility: "hidden" });
					}
				};
		$saveButton.onclick = () => {
			if (
				$startDate.value !== "" &&
				$endDate.value !== "" &&
				compareDateStrings($startDate.value, $endDate.value) <= 0 &&
				($startDate.value !== breakObject.startDate ||
					$endDate.value !== breakObject.endDate ||
					$scheduleSelect.value !== (breakObject.schedule ?? ""))
			) {
				if (
					stringOnInterval(
						$startDate.value,
						[
							configuration.schoolYears[currentSchoolYear].bounds
								.startDate,
							configuration.schoolYears[currentSchoolYear].bounds
								.endDate,
						],
						true,
					) &&
					stringOnInterval(
						$endDate.value,
						[
							configuration.schoolYears[currentSchoolYear].bounds
								.startDate,
							configuration.schoolYears[currentSchoolYear].bounds
								.endDate,
						],
						true,
					)
				) {
					breakObject = configuration.schoolYears[
						currentSchoolYear
					].breaks[breakKey] = {
						startDate: $startDate.value,
						endDate: $endDate.value,
						defaultSchedule:
							$scheduleSelect.value === ""
								? null
								: $scheduleSelect.value,
					};
					notifyChange();
					$saveButton.style.visibility = "hidden";
					reloadCalendar(configuration);
					$page.breaks.error.innerHTML = "&nbsp;";
				} else {
					$page.breaks.error.innerHTML =
						"break is out of school year bounds";
				}
			} else {
				$page.breaks.error.innerHTML = "break is invalid";
			}
		};
		$deleteButton.onclick = () => {
			delete configuration.schoolYears[currentSchoolYear].breaks[
				breakKey
			];
			notifyChange();
			reloadCalendar(configuration);
			$parent.remove();
		};
		return ui.children(ui.classes($parent, ["form-group"]), [
			$startDate,
			ui.update(ui.make("span"), {
				innerHTML: "&nbsp;–&nbsp;",
			}),
			$endDate,
			ui.separator(),
			ui.children(ui.classes(ui.make("div"), ["select-wrapper"]), [
				$scheduleSelect,
			]),
			ui.separator(),
			$saveButton,
			ui.separator(),
			$deleteButton,
		]);
	},
	renderBreaks = (breaks) => {
		$page.breaks.list.innerText = "";

		$page.breaks.add.startDate.value =
			$page.breaks.add.schedule.value =
			$page.breaks.add.endDate.value =
				"";

		$page.breaks.add.submit.disabled = true;

		if (breaks === undefined) breaks = {};
		ui.children(
			$page.breaks.list,
			Object.keys(breaks).map((breakKey) =>
				renderBreak(breakKey, breaks[breakKey]),
			),
		);

		$page.breaks.add.startDate.onkeyup =
			$page.breaks.add.schedule.onchange =
			$page.breaks.add.endDate.onkeyup =
				() => {
					if (
						$page.breaks.add.startDate.value !== "" &&
						$page.breaks.add.endDate.value !== "" &&
						compareDateStrings(
							$page.breaks.add.startDate.value,
							$page.breaks.add.endDate.value,
						) <= 0
					) {
						$page.breaks.add.submit.disabled = false;
					} else {
						$page.breaks.add.submit.disabled = true;
					}
				};

		$page.breaks.add.submit.onclick = () => {
			if (
				$page.breaks.add.startDate.value !== "" &&
				$page.breaks.add.endDate.value !== ""
			) {
				if (
					compareDateStrings(
						$page.breaks.add.startDate.value,
						$page.breaks.add.endDate.value,
					) <= 0
				) {
					if (
						stringOnInterval(
							$page.breaks.add.startDate.value,
							[
								configuration.schoolYears[currentSchoolYear]
									.bounds.startDate,
								configuration.schoolYears[currentSchoolYear]
									.bounds.endDate,
							],
							true,
						) &&
						stringOnInterval(
							$page.breaks.add.endDate.value,
							[
								configuration.schoolYears[currentSchoolYear]
									.bounds.startDate,
								configuration.schoolYears[currentSchoolYear]
									.bounds.endDate,
							],
							true,
						)
					) {
						const key = generateConfigurationKey(
							currentSchoolYear,
							"breaks",
						);
						if (
							!configuration.schoolYears[currentSchoolYear].breaks
						) {
							configuration.schoolYears[
								currentSchoolYear
							].breaks = {};
						}
						configuration.schoolYears[currentSchoolYear].breaks[
							key
						] = {
							startDate: $page.breaks.add.startDate.value,
							endDate: $page.breaks.add.endDate.value,
							defaultSchedule:
								$page.specialSchedules.add.schedule.value,
						};
						notifyChange();
						reloadCalendar(configuration);
						ui.children($page.breaks.list, [
							renderBreak(
								key,
								configuration.schoolYears[currentSchoolYear]
									.breaks[key],
							),
						]);

						$page.breaks.add.startDate.value =
							$page.breaks.add.schedule.value =
							$page.breaks.add.endDate.value =
								"";

						$page.breaks.add.submit.disabled = true;
						$page.breaks.add.error.innerHTML = "&nbsp;";
					} else {
						$page.breaks.add.error.innerHTML =
							"break is out of school year bounds";
					}
				} else {
					$page.breaks.add.error.innerHTML = "break is invalid";
				}
			} else {
				$page.breaks.add.error.innerHTML = "break is incomplete";
			}
		};

		renderScheduleSelect($page.breaks.add.schedule);
	},
	renderSpecialSchedule = (specialScheduleKey, specialSchedule) => {
		const $parent = ui.make("div");
		const $dateInput = ui.update(ui.make("input"), {
				type: "date",
				value: specialSchedule.date,
			}),
			$scheduleSelect = ui.update(
				renderScheduleSelect(ui.make("select")),
				{
					value: specialSchedule.schedule,
				},
			),
			$saveButton = ui.style(
				ui.update(ui.make("button"), {
					innerText: "💾",
				}),
				{ visibility: "hidden" },
			),
			$deleteButton = ui.update(ui.make("button"), {
				innerText: "🗑️",
			});
		$dateInput.onkeyup = $scheduleSelect.onchange = () => {
			if (
				$dateInput.value !== "" &&
				$scheduleSelect.value !== "" &&
				($dateInput.value !== specialSchedule.date ||
					$scheduleSelect.value !== specialSchedule.schedule)
			) {
				ui.style($saveButton, { visibility: "visible" });
			} else {
				ui.style($saveButton, { visibility: "hidden" });
			}
		};
		$saveButton.onclick = () => {
			if ($dateInput.value !== "" && $scheduleSelect.value !== "") {
				if (
					stringOnInterval(
						$dateInput.value,
						[
							configuration.schoolYears[currentSchoolYear].bounds
								.startDate,
							configuration.schoolYears[currentSchoolYear].bounds
								.endDate,
						],
						true,
					)
				) {
					specialSchedule = configuration.schoolYears[
						currentSchoolYear
					].specialSchedules[specialScheduleKey] = {
						date: $dateInput.value,
						schedule: $scheduleSelect.value,
					};
					notifyChange();
					$saveButton.style.visibility = "hidden";
					reloadCalendar(configuration);
					$page.specialSchedules.error.innerHTML = "&nbsp;";
				} else {
					$page.specialSchedules.error.innerHTML =
						"out of school year bounds";
				}
			} else {
				$page.specialSchedules.error.innerHTML =
					"special schedule is invalid";
			}
		};
		$deleteButton.onclick = () => {
			delete configuration.schoolYears[currentSchoolYear]
				.specialSchedules[specialScheduleKey];
			notifyChange();
			reloadCalendar(configuration);

			$parent.remove();
		};
		return ui.children(ui.classes($parent, ["form-group"]), [
			$dateInput,
			ui.separator(),
			ui.children(ui.classes(ui.make("div"), ["select-wrapper"]), [
				$scheduleSelect,
			]),
			ui.separator(),
			$saveButton,
			ui.separator(),
			$deleteButton,
		]);
	},
	renderSpecialSchedules = (specialSchedules) => {
		$page.specialSchedules.list.innerText = "";

		$page.specialSchedules.add.date.value =
			$page.specialSchedules.add.schedule.value = "";
		$page.specialSchedules.add.submit.disabled = true;

		if (specialSchedules === undefined) specialSchedules = {};
		ui.children(
			$page.specialSchedules.list,
			Object.keys(specialSchedules).map((specialScheduleKey) =>
				renderSpecialSchedule(
					specialScheduleKey,
					specialSchedules[specialScheduleKey],
				),
			),
		);
		$page.specialSchedules.add.schedule.onchange =
			$page.specialSchedules.add.date.onkeyup = () => {
				if (
					$page.specialSchedules.add.date.value !== "" &&
					$page.specialSchedules.add.schedule.value !== ""
				) {
					$page.specialSchedules.add.submit.disabled = false;
				} else {
					$page.specialSchedules.add.submit.disabled = true;
				}
			};
		$page.specialSchedules.add.submit.onclick = () => {
			if (
				$page.specialSchedules.add.date.value !== "" &&
				$page.specialSchedules.add.schedule.value !== ""
			) {
				if (
					stringOnInterval(
						$page.specialSchedules.add.date.value,
						[
							configuration.schoolYears[currentSchoolYear].bounds
								.startDate,
							configuration.schoolYears[currentSchoolYear].bounds
								.endDate,
						],
						true,
					)
				) {
					const key = generateConfigurationKey(
						currentSchoolYear,
						"specialSchedules",
					);
					if (
						!configuration.schoolYears[currentSchoolYear]
							.specialSchedules
					) {
						configuration.schoolYears[
							currentSchoolYear
						].specialSchedules = {};
					}
					configuration.schoolYears[
						currentSchoolYear
					].specialSchedules[key] = {
						date: $page.specialSchedules.add.date.value,
						schedule: $page.specialSchedules.add.schedule.value,
					};
					notifyChange();
					reloadCalendar(configuration);
					ui.children($page.specialSchedules.list, [
						renderSpecialSchedule(
							key,
							configuration.schoolYears[currentSchoolYear]
								.specialSchedules[key],
						),
					]);
					$page.specialSchedules.add.date.value =
						$page.specialSchedules.add.schedule.value = "";
					$page.specialSchedules.add.submit.disabled = true;
					$page.specialSchedules.add.error.innerHTML = "&nbsp;";
				} else {
					$page.specialSchedules.add.error.innerHTML =
						"out of school year bounds";
				}
			} else {
				$page.specialSchedules.add.error.innerHTML =
					"input is incomplete";
			}
		};
		renderScheduleSelect($page.specialSchedules.add.schedule);
	},
	showAuxiliaryControls = () => {
		$page.auxiliaryControls.style.display = "block";
	},
	hideAuxiliaryControls = () => {
		$page.auxiliaryControls.style.display = "none";
	},
	renderScheduleSelect = ($select) => {
		$select.innerHTML = "";
		$select.appendChild(
			ui.update(ui.make("option"), {
				value: "",
				innerText: "(No schedule)",
			}),
		);
		ui.children(
			$select,
			Object.keys(schedules).map((scheduleKey) =>
				ui.update(ui.make("option"), {
					value: scheduleKey,
					innerText: schedules[scheduleKey].name,
				}),
			),
		);
		return $select;
	};
