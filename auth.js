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
//   SECTION 1 — Login Card Alert
//   (Login form ke neeche dikhata hai)
// ══════════════════════════════════════════════════

function showLoginAlert(message, type = 'danger') {
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

  const card = document.querySelector('.login-card');
  if (card) card.appendChild(alertDiv);
  else document.body.appendChild(alertDiv);

  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
    }
  }, 5000);
}

// ══════════════════════════════════════════════════
//   SECTION 2 — Register Modal Alert
//   (Modal ke andar dikhata hai)
// ══════════════════════════════════════════════════

function showRegisterAlert(message, type = 'danger') {
  const box = document.getElementById('registerAlertBox');
  if (!box) return;

  box.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show"
      role="alert"
      style="border-radius:10px;font-family:'Poppins',sans-serif;
      font-size:0.84rem;font-weight:500;margin-bottom:14px;">
      ${message}
      <button type="button" class="btn-close"
        data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  setTimeout(() => { box.innerHTML = ''; }, 5000);
}

// ══════════════════════════════════════════════════
//   SECTION 3 — Firebase Error Messages
// ══════════════════════════════════════════════════

function getErrorMessage(errorCode) {
  const errors = {
    'auth/user-not-found':
      '❌ <strong>Email registered nahi hai.</strong> Pehle register karo.',
    'auth/wrong-password':
      '❌ <strong>Password galat hai.</strong> Dobara try karo.',
    'auth/invalid-email':
      '❌ <strong>Email format sahi nahi hai.</strong>',
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
//   SECTION 4 — Login Button Loading State
// ══════════════════════════════════════════════════

function setLoginLoading(isLoading) {
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
//   SECTION 5 — Register Button Loading State
// ══════════════════════════════════════════════════

function setRegisterLoading(isLoading) {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="spinner-border spinner-border-sm"
        role="status" aria-hidden="true"
        style="margin-right:8px;"></span>
      Account ban raha hai...
    `;
  } else {
    btn.disabled = false;
    btn.textContent = '✅ Account Banao';
  }
}

// ══════════════════════════════════════════════════
//   SECTION 6 — MAIN LOGIN FUNCTION
// ══════════════════════════════════════════════════

async function doLogin() {
  const email    = document.getElementById('email')?.value.trim();
  const name     = document.getElementById('name')?.value.trim();
  const password = document.getElementById('password')?.value;

  // ── Validation ──────────────────────────────────
  if (!email || !name || !password) {
    showLoginAlert(
      '⚠️ <strong>Sabhi fields bharna zaroori hai.</strong> Email, Naam aur Password daalo.',
      'warning'
    );
    return;
  }
  if (!email.includes('@')) {
    showLoginAlert(
      '⚠️ <strong>Email sahi nahi hai.</strong> Valid email daalo.',
      'warning'
    );
    return;
  }
  if (password.length < 6) {
    showLoginAlert(
      '⚠️ <strong>Password bahut chhota hai.</strong> 6+ characters chahiye.',
      'warning'
    );
    return;
  }

  setLoginLoading(true);

  try {
    // ── Firebase Login ───────────────────────────
    const userCredential = await signInWithEmailAndPassword(
      auth, email, password
    );
    const firebaseUser = userCredential.user;

    // ── localStorage mein save ───────────────────
    localStorage.setItem('ayaUser', JSON.stringify({
      name:  name,
      email: firebaseUser.email,
      uid:   firebaseUser.uid,
    }));

    showLoginAlert(
      `✅ <strong>Login successful!</strong>
       Welcome, <strong>${name}</strong>! Redirect ho raha hai...`,
      'success'
    );

    console.log('✅ Login OK | UID:', firebaseUser.uid);

    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1200);

  } catch (error) {
    console.error('❌ Login error:', error.code);
    showLoginAlert(getErrorMessage(error.code), 'danger');
    setLoginLoading(false);
  }
}

// ══════════════════════════════════════════════════
//   SECTION 7 — REGISTER FUNCTION
//   Success hone par patient.html pe jayega
// ══════════════════════════════════════════════════

async function doRegister() {
  const name            = document.getElementById('regName')?.value.trim();
  const email           = document.getElementById('regEmail')?.value.trim();
  const password        = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;

  // ── Validation ──────────────────────────────────
  if (!name || !email || !password || !confirmPassword) {
    showRegisterAlert(
      '⚠️ <strong>Sabhi fields bharna zaroori hai.</strong>',
      'warning'
    );
    return;
  }
  if (!email.includes('@')) {
    showRegisterAlert(
      '⚠️ <strong>Email sahi nahi hai.</strong>',
      'warning'
    );
    return;
  }
  if (password.length < 6) {
    showRegisterAlert(
      '⚠️ <strong>Password kam se kam 6 characters ka hona chahiye.</strong>',
      'warning'
    );
    return;
  }
  if (password !== confirmPassword) {
    showRegisterAlert(
      '❌ <strong>Dono passwords match nahi kar rahe.</strong> Dobara check karo.',
      'danger'
    );
    return;
  }

  setRegisterLoading(true);

  try {
    // ── Firebase Register ────────────────────────
    const userCredential = await createUserWithEmailAndPassword(
      auth, email, password
    );
    const firebaseUser = userCredential.user;

    // ── localStorage mein save ───────────────────
    localStorage.setItem('ayaUser', JSON.stringify({
      name:  name,
      email: firebaseUser.email,
      uid:   firebaseUser.uid,
    }));

    showRegisterAlert(
      `✅ <strong>Account ban gaya!</strong>
       Welcome, <strong>${name}</strong>!
       Patient form par ja raha hai...`,
      'success'
    );

    console.log('✅ Register OK | UID:', firebaseUser.uid);

    // ── Patient.html pe redirect ─────────────────
    setTimeout(() => {
      window.location.href = 'patient.html';
    }, 1500);

  } catch (error) {
    console.error('❌ Register error:', error.code);
    showRegisterAlert(getErrorMessage(error.code), 'danger');
    setRegisterLoading(false);
  }
}
// ══════════════════════════════════════════════════
//   SECTION 8 — LOGOUT FUNCTION
//   (Profile page se call hogi)
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
//   SECTION 9 — AUTH STATE OBSERVER
//   Pehle se logged in hai toh home.html pe bhejo
// ══════════════════════════════════════════════════

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Already logged in:', user.email);
    window.location.href = 'home.html';
  }
});

// ══════════════════════════════════════════════════
//   SECTION 10 — ENTER KEY SUPPORT
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Modal khula hua hai toh register karo
      const modal = document.getElementById('registerModal');
      const isOpen = modal?.classList.contains('show');
      if (isOpen) {
        doRegister();
      } else {
        doLogin();
      }
    }
  });
});

// ══════════════════════════════════════════════════
//   SECTION 11 — WINDOW PE EXPOSE KARO
//   (HTML ke onclick="" se call hone ke liye)
// ══════════════════════════════════════════════════

window.doLogin    = doLogin;
window.doRegister = doRegister;
window.doLogout   = doLogout;
