import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYENtxM80ODy7j4dOqS9qahgRQ_uw7pas",
  authDomain: "ubsa-fb.firebaseapp.com",
  databaseURL: "https://ubsa-fb.firebaseio.com",
  projectId: "ubsa-fb",
  storageBucket: "ubsa-fb.appspot.com",
  messagingSenderId: "295845474213",
  appId: "1:295845474213:web:005f10f9d158829ea7824c",
  measurementId: "G-Z245TQWFGD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig),
  db = getDatabase(app),
  auth = getAuth(app);

export { auth, db };
