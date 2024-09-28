export class Tasker {
  #tasks = {};
  #lastUpdate = 0;
  constructor(onResolution, properties) {
    this.onResolution = onResolution;
    this.#lastUpdate = new Date().getTime();
    if (properties !== undefined && typeof properties === "object") {
      if (
        properties.autoReset !== undefined &&
        typeof properties.autoReset === "number"
      ) {
        this.autoReset = properties.autoReset;
      }
    }
    this.checkResolution();
  }
  addTask(task) {
    const uuid = crypto.randomUUID();
    this.#tasks[uuid] = task;
    task
      .then(() => {
        if (Object.hasOwn(this.#tasks, uuid)) {
          this.#tasks[uuid] = true;
          this.#lastUpdate = new Date().getTime();
          this.checkResolution();
        }
      })
      .catch(() => {
        if (Object.hasOwn(this.#tasks, uuid)) {
          this.#tasks[uuid] = false;
          this.#lastUpdate = new Date().getTime();
          this.checkResolution();
        }
      });
    this.#lastUpdate = new Date().getTime();
    this.checkResolution();
  }
  reset() {
    this.#tasks = {};
    this.breakdown = { completed: 0, failed: 0, inProgress: 0 };
    this.#lastUpdate = new Date().getTime();
    this.checkResolution();
  }
  checkResolution() {
    this.breakdown = Object.values(this.#tasks).reduce(
      (accumulator, task) => {
        if (task === true) {
          accumulator.completed += 1;
        } else if (task === false) {
          accumulator.failed += 1;
        } else {
          accumulator.inProgress += 1;
        }
        return accumulator;
      },
      { completed: 0, failed: 0, inProgress: 0 },
    );

    if (
      this.onResolution === undefined ||
      typeof this.onResolution !== "function"
    )
      return;
    this.onResolution(this.breakdown);

    if (this.autoReset !== undefined) {
      setTimeout(() => {
        if (new Date().getTime() <= this.#lastUpdate + this.autoReset) return;
        this.reset();
      }, this.autoReset);
    }
  }
}
