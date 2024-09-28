import * as auth from "../../api/auth.js";
import { parseQuery } from "../../shared/parseQuery.js";
import * as ui from "../../shared/ui.js";

const $message = ui.find("with-email-message"),
  $ellipsis = ui.find("with-email-loading"),
  $returnLink = ui.find("with-email-return-link");

const parsedQuery = parseQuery(location.search);
if (parsedQuery.username === undefined) {
  ui.stopEllipsis($ellipsis);
  $message.innerText =
    "no username seen for this link. please double-check the link from your e-mail.";
} else {
  auth
    .acceptEmailSignIn(parsedQuery.username)
    .then((user) => {
      if (user === null) {
        ui.stopEllipsis($ellipsis);
        $message.innerText = "we were unable to sign you in :(";
      } else {
        ui.stopEllipsis($ellipsis);
        $message.classList.remove("color-red");
        $returnLink.remove();
        $message.innerText =
          "you were successfully signed in. please stand by as we redirect you...";
        location.assign("../../manage");
      }
    })
    .catch((error) => {
      $ellipsis.classList.add("stopped");
      $message.innerText =
        "there was an error with your login. please make sure you haven't used this sign-in link before.";
      return;
    });
}
