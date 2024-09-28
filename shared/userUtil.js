import * as auth from "../api/auth.js";

export const getInstance = (withFailureRedirect) =>
  new Promise((resolve, reject) =>
    auth
      .getInstanceForUser()
      .then((instanceRef) => resolve(instanceRef))
      .catch((error) => {
        if (withFailureRedirect !== undefined)
          return auth
            .signOut()
            .then(() => location.assign(withFailureRedirect));
        return reject();
      }),
  );
