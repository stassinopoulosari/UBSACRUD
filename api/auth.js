import * as auth from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import * as db from "./db.js";
import * as ubsa from "./base.js";

const url = new URL(location.href);
console.log(`${url.protocol}//${url.host}/login/with-email?username=`);

export const signOut = () => auth.signOut(ubsa.auth),
  getCurrentUser = () =>
    new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(ubsa.auth, (user) => {
        unsubscribe();
        return resolve(user);
      });
    }),
  signInWithEmail = (username) =>
    auth.sendSignInLinkToEmail(ubsa.auth, username, {
      url: `${url.protocol}//${url.host}/login/with-email?username=${username}`,
      handleCodeInApp: true,
    }),
  acceptEmailSignIn = (username) =>
    new Promise((resolve, reject) => {
      if (auth.isSignInWithEmailLink(ubsa.auth, location.href)) {
        return auth
          .signInWithEmailLink(ubsa.auth, username, location.href)
          .then(resolve)
          .catch(reject);
      }
      return reject();
    }),
  checkUserValidity = () =>
    new Promise((resolve, reject) =>
      getCurrentUser()
        .then((user) => {
          if (user === null) return reject();
          db.quickGet(db.ref(`users/${user.uid}`))
            .then((userSnapshot) => {
              if (!userSnapshot.exists()) {
                return reject();
              }
              return resolve(userSnapshot);
            })
            .catch((error) => {
              return reject();
            });
        })
        .catch(() => reject()),
    ),
  getInstanceForUser = () =>
    new Promise((resolve, reject) => {
      checkUserValidity()
        .then((userSnapshot) => {
          const instance = userSnapshot.child("school").val();
          if (instance === null) throw "User does not have a valid instance";
          return resolve(db.ref(`schools/${instance}`));
        })
        .catch(reject);
    });
