// ================================================
//   AYA HOSPITAL — auth.js
//   Firebase Email/Password Authentication
//   Project: hospital-170a2
// ================================================

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// ══════════════════════════════════════════════════
//   SECTION 1 — Bootstrap Alert Helper
//   (Login card ke andar alert dikhata hai)
// ══════════════════════════════════════════════════

function showAlert(message, type = 'danger') {
  // Purana alert hatao pehle
  const existing = document.getElementById('authAlert');
  if (existing) existing.remove();

  const alertDiv = document.createElement('div');
  alertDiv.id = 'authAlert';
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.style.cssText = `
    margin-top: 14px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
  `;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close"
      data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  // Login card ke andar daalo
  const card = document.querySelector('.login-card');
  if (card) {
    card.appendChild(alertDiv);
  } else {
    document.body.appendChild(alertDiv);
  }

  // 5 second baad apne aap hatega
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
    }
  }, 5000);
}

// ══════════════════════════════════════════════════
//   SECTION 2 — Firebase Error Codes
//   (Samajhne layak messages mein badlo)
// ══════════════════════════════════════════════════

function getErrorMessage(errorCode) {
  const errors = {
    'auth/user-not-found':
      '❌ <strong>Email registered nahi hai.</strong> Pehle register karo.',
    'auth/wrong-password':
      '❌ <strong>Password galat hai.</strong> Dobara try karo.',
    'auth/invalid-email':
      '❌ <strong>Email format sahi nahi hai.</strong> Sahi email daalo.',
    'auth/invalid-credential':
      '❌ <strong>Email ya Password galat hai.</strong> Dobara check karo.',
    'auth/user-disabled':
      '❌ <strong>Account band kar diya gaya hai.</strong> Admin se milein.',
    'auth/too-many-requests':
      '❌ <strong>Bahut zyada galat tries.</strong> Kuch der baad try karo.',
    'auth/network-request-failed':
      '❌ <strong>Internet nahi hai.</strong> Connection check karo.',
    'auth/email-already-in-use':
      '❌ <strong>Email pehle se registered hai.</strong> Login karo.',
    'auth/weak-password':
      '❌ <strong>Password bahut kamzor hai.</strong> 6+ characters daalo.',
    'auth/operation-not-allowed':
      '❌ <strong>Email/Password login enable nahi.</strong> Firebase Console check karo.',
    'auth/missing-password':
      '❌ <strong>Password daalna zaroori hai.</strong>',
  };
  return errors[errorCode]
    || `❌ <strong>Kuch galat hua.</strong> (${errorCode})`;
}

// ══════════════════════════════════════════════════
//   SECTION 3 — Button Loading State
// ══════════════════════════════════════════════════

function setButtonLoading(isLoading) {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="spinner-border spinner-border-sm"
        role="status" aria-hidden="true"
        style="margin-right:8px;"></span>
      Login ho raha hai...
    `;
  } else {
    btn.disabled = false;
    btn.textContent = 'Login →';
  }
}

// ══════════════════════════════════════════════════
//   SECTION 4 — Form Validation
// ══════════════════════════════════════════════════

function validateForm(email, name, password) {
  if (!email || !name || !password) {
    showAlert(
      '⚠️ <strong>Sabhi fields bharna zaroori hai.</strong> Email, Naam aur Password daalo.',
      'warning'
    );
    return false;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showAlert(
      '⚠️ <strong>Email sahi nahi hai.</strong> Valid email daalo (jaise: abc@gmail.com)',
      'warning'
    );
    return false;
  }
  if (password.length < 6) {
    showAlert(
      '⚠️ <strong>Password bahut chhota hai.</strong> Kam se kam 6 characters chahiye.',
      'warning'
    );
    return false;
  }
  return true;
}

// ══════════════════════════════════════════════════
//   SECTION 5 — MAIN LOGIN FUNCTION
//   (Login button click hone par chalega)
// ══════════════════════════════════════════════════

async function doLogin() {
  // Form fields ki values lo
  const email    = document.getElementById('email')?.value.trim();
  const name     = document.getElementById('name')?.value.trim();
  const password = document.getElementById('password')?.value;

  // Validation check
  if (!validateForm(email, name, password)) return;

  // Button ko loading mein daalo
  setButtonLoading(true);

  try {
    // ── Firebase se login karo ───────────────────
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    // ── User data localStorage mein save karo ────
    const userData = {
      name:  name,
      email: firebaseUser.email,
      uid:   firebaseUser.uid,
    };
    localStorage.setItem('ayaUser', JSON.stringify(userData));

    // ── Success alert dikhao ─────────────────────
    showAlert(
      `✅ <strong>Login successful!</strong><br>
       <small>Welcome back, <strong>${name}</strong>!
       Home page par ja raha hai...</small>`,
      'success'
    );

    console.log('✅ Login OK | UID:', firebaseUser.uid,
                '| Project: hospital-170a2');

    // ── 1.2 second baad home.html pe redirect ────
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1200);

  } catch (error) {
    // ── Firebase error ───────────────────────────
    console.error('❌ Login failed:', error.code);
    showAlert(getErrorMessage(error.code), 'danger');
    setButtonLoading(false);
  }
}

// ══════════════════════════════════════════════════
//   SECTION 6 — REGISTER FUNCTION
//   (Naya account banana ho tab)
// ══════════════════════════════════════════════════

async function doRegister() {
  const email    = document.getElementById('email')?.value.trim();
  const name     = document.getElementById('name')?.value.trim();
  const password = document.getElementById('password')?.value;

  if (!validateForm(email, name, password)) return;

  setButtonLoading(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    localStorage.setItem('ayaUser', JSON.stringify({
      name:  name,
      email: firebaseUser.email,
      uid:   firebaseUser.uid,
    }));

    showAlert(
      `✅ <strong>Account ban gaya!</strong><br>
       <small>Welcome, <strong>${name}</strong>!
       Home page par ja raha hai...</small>`,
      'success'
    );

    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1200);

  } catch (error) {
    console.error('❌ Register failed:', error.code);
    showAlert(getErrorMessage(error.code), 'danger');
    setButtonLoading(false);
  }
}

// ══════════════════════════════════════════════════
//   SECTION 7 — LOGOUT FUNCTION
//   (Profile page ya dusri jagah se call hogi)
// ══════════════════════════════════════════════════

async function doLogout() {
  try {
    await signOut(auth);
    localStorage.clear();
    console.log('✅ Logout successful');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('❌ Logout error:', error.code);
  }
}

// ══════════════════════════════════════════════════
//   SECTION 8 — AUTH STATE OBSERVER
//   Agar user pehle se logged in hai toh
//   seedha home.html pe bhejo
// ══════════════════════════════════════════════════

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Already logged in:', user.email);
    window.location.href = 'home.html';
  }
});

// ══════════════════════════════════════════════════
//   SECTION 9 — ENTER KEY SUPPORT
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });
});

// ══════════════════════════════════════════════════
//   SECTION 10 — WINDOW PE EXPOSE KARO
//   (HTML ke onclick="" se call hone ke liye)
// ══════════════════════════════════════════════════

window.doLogin    = doLogin;
window.doRegister = doRegister;
window.doLogout   = doLogout;
