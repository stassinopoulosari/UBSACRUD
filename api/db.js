import * as db from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import * as ubsa from "./base.js";

export const ref = (path) => db.ref(ubsa.db, path),
  get = db.get,
  quickGet = (ref) =>
    new Promise((resolve) => {
      return db.onValue(ref, resolve, { onlyOnce: true });
    }),
  push = db.push,
  set = db.set,
  update = db.update,
  child = db.child;
