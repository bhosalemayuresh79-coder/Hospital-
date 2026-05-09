// ================================================
//   AYA HOSPITAL — Firebase Configuration
//   firebase-config.js
// ================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase Config ──────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAngOxc99dsVId7JS08IiVWcq4sA5NsDR4",
  authDomain:        "gemini-prompt-8e465.firebaseapp.com",
  projectId:         "gemini-prompt-8e465",
  storageBucket:     "gemini-prompt-8e465.firebasestorage.app",
  messagingSenderId: "994008586611",
  appId:             "1:994008586611:web:304aec118fe52eeb17cd06",
  measurementId:     "G-EYQL3DWSXW"
};

// ── Initialize Firebase ───────────────────────────
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);

// ── Confirm Connection ────────────────────────────
console.log("✅ Firebase Connected Successfully!");

// ── Export for use in other files ────────────────
export { app, analytics, auth, db };
