import * as db from "./db.js";

// Get all schedules
export const getSchedules = (instanceRef) =>
		new Promise((resolve, reject) =>
			db
				.quickGet(db.child(instanceRef, "schedules"))
				.then((schedulesSnapshot) => {
					const schedules = schedulesSnapshot.val();
					// Make sure there are any schedules
					if (
						schedulesSnapshot !== undefined &&
						typeof schedulesSnapshot === "object"
					) {
						const returnedSchedules = {};
						for (const scheduleKey in schedules) {
							const schedule = schedules[scheduleKey],
								hidden = schedule.hidden;
							// Don't return hidden schedules
							if (hidden === true) continue;
							returnedSchedules[scheduleKey] = schedule;
						}
						return resolve(returnedSchedules);
					} else {
						resolve({});
					}
				})
				.catch(reject),
		),
	symbolExistsInSchedules = (instanceRef, symbolKey) =>
		new Promise((resolve, reject) =>
			getSchedules(instanceRef)
				.then((schedules) => {
					let symbolExists = false;
					const symbolSearch = `$(${symbolKey})`;
					// Loop through the periods of each schedule until we find a reference to the symbolKey
					for (const schedule of Object.values(schedules)) {
						for (const periodKey in schedule) {
							if (periodKey === "name" || periodKey === "hidden")
								continue;
							if (typeof schedule[periodKey].name !== "string")
								continue;
							if (
								schedule[periodKey].name.includes(symbolSearch)
							) {
								symbolExists = true;
								break;
							}
						}
					}
					return resolve(symbolExists);
				})
				.catch(reject),
		),
	getSchedule = (instanceRef, scheduleKey) =>
		new Promise((resolve, reject) =>
			db
				.quickGet(db.child(instanceRef, `schedules/${scheduleKey}`))
				.then((scheduleSnapshot) => resolve(scheduleSnapshot.val()))
				.catch(reject),
		),
	createSchedule = (instanceRef) =>
		new Promise((resolve, reject) => {
			const ref = db.push(db.child(instanceRef, `schedules`), {
				name: "new schedule",
			});
			ref.then(() => resolve(ref.key)).catch(reject);
		}),
	hideSchedule = (instanceRef, scheduleKey) =>
		db.update(db.child(instanceRef, `schedules/${scheduleKey}`), {
			hidden: true,
		}),
	addPeriod = (instanceRef, scheduleKey, period) =>
		db.push(db.child(instanceRef, `schedules/${scheduleKey}`), period),
	renameSchedule = (instanceRef, scheduleKey, newName) =>
		db.set(db.child(instanceRef, `schedules/${scheduleKey}/name`), newName),
	savePeriods = (instanceRef, scheduleKey, periods) =>
		new Promise((resolve, reject) =>
			getSchedule(instanceRef, scheduleKey).then((remoteSchedule) => {
				const promiseChain = periods
					// Create sequential list of period push promises
					.map(
						(period) => () =>
							addPeriod(instanceRef, scheduleKey, period),
					)
					.concat([() => resolve()]);
				// First clear out schedule except for name and hidden, then run the push promises in order
				promiseChain.reduce(
					(chain, promise) => chain.then(promise).catch(reject),
					db.set(db.child(instanceRef, `schedules/${scheduleKey}`), {
						name: remoteSchedule.name,
						hidden: remoteSchedule.hidden ?? null,
					}),
				);
			}),
		);
