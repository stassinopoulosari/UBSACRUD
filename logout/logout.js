import * as auth from "../../api/auth.js";

auth.signOut().then(() => {
  location.assign("../login");
});
