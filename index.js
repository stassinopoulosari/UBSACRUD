import * as auth from "./api/auth.js";

(() =>
  auth
    .getCurrentUser()
    .then((user) => {
      if (user === null) return location.assign("./login");
      location.assign("./manage");
    })
    .catch(() => {
      location.assign("./login");
    }))();
