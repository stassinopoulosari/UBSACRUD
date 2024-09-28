import * as auth from "../api/auth.js";
import * as ui from "../shared/ui.js";

(() => {
  auth.getCurrentUser().then((user) => {
    if (user !== null) return location.assign("../manage");
  });

  const $loginForm = ui.find("login"),
    $username = ui.find("login-username"),
    $thinking = ui.find("login-thinking"),
    $submit = ui.find("login-submit");

  $loginForm.onsubmit = (e) => {
    $username.disabled = true;
    $submit.disabled = true;
    e.preventDefault();
    $thinking.classList.remove("color-red");
    $thinking.classList.remove("color-green");

    $thinking.innerText = "working on it";
    ui.addEllipsis($thinking);
    const username = $username.value;
    auth
      .signInWithEmail(username)
      .then(() => {
        $thinking.classList.add("color-green");
        $submit.value = "please click the link in your e-mail to continue.";
        $thinking.innerText = "we sent you a login e-mail.";
      })
      .catch((error) => {
        console.log(error);
        $thinking.classList.add("color-red");
        $thinking.innerText =
          "we weren't able to sign you in. double-check your e-mail address?";
        $username.disabled = false;
        $submit.disabled = false;
      });
  };
})();
