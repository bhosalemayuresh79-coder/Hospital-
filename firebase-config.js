// ================================================
//   AYA HOSPITAL — Firebase Configuration
//   firebase-config.js
//   Project: hospital-170a2
// ================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ── Naya Firebase Config (hospital-170a2) ────────
const firebaseConfig = {
  apiKey:            "AIzaSyBQXHP5yNR47ybJO-rb0_Lj2ZQH751fvTY",
  authDomain:        "hospital-170a2.firebaseapp.com",
  projectId:         "hospital-170a2",
  storageBucket:     "hospital-170a2.firebasestorage.app",
  messagingSenderId: "545831241271",
  appId:             "1:545831241271:web:52b6584b1836e812cb21b2",
  measurementId:     "G-WTJ6GJKD7V"
};

// ── Firebase Initialize ───────────────────────────
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);

// ── Connection Confirm ────────────────────────────
console.log("✅ Firebase Connected Successfully! Project: hospital-170a2");

// ── Export — dusri files import kar sakti hain ───
export { app, analytics, auth, db };
