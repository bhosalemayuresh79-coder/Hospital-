// ================================================
//   AYA HOSPITAL — app.js
//   Shared JS: localStorage helpers + Firebase
//   Firestore patient data entry logic
//   Firebase Project: hospital-170a2
// ================================================

import { db } from "./firebase-config.js";
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ══════════════════════════════════════════════════
//   SECTION 1 — localStorage Keys & Helpers
// ══════════════════════════════════════════════════

const KEYS = {
  user:         'ayaUser',
  patient:      'ayaPatient',
  appointments: 'ayaAppointments',
  darkMode:     'ayaDarkMode',
  language:     'ayaLanguage',
};

function requireAuth() {
  const user = getUser();
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}

function getUser()     { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
function setUser(data) { localStorage.setItem(KEYS.user, JSON.stringify(data)); }
function clearUser()   { localStorage.removeItem(KEYS.user); }

function getPatient()  { return JSON.parse(localStorage.getItem(KEYS.patient) || 'null'); }
function setPatient(d) { localStorage.setItem(KEYS.patient, JSON.stringify(d)); }

function getAppointments() {
  return JSON.parse(localStorage.getItem(KEYS.appointments) || '[]');
}
function saveAppointments(arr) {
  localStorage.setItem(KEYS.appointments, JSON.stringify(arr));
}
function addAppointment(appt) {
  const arr = getAppointments();
  appt.id = Date.now().toString();
  arr.unshift(appt);
  saveAppointments(arr);
}
function cancelAppointment(id) {
  const arr = getAppointments().filter(a => a.id !== id);
  saveAppointments(arr);
}

function isDarkMode()     { return localStorage.getItem(KEYS.darkMode) === 'true'; }
function setDarkMode(val) {
  localStorage.setItem(KEYS.darkMode, val);
  document.body.classList.toggle('dark-mode', val);
}
function initDarkMode() { if (isDarkMode()) document.body.classList.add('dark-mode'); }

function logout() { localStorage.clear(); window.location.href = 'index.html'; }

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

function buildTabBar(activePage) {
  const tabs = [
    { id: 'home',        href: 'home.html',        icon: '🏠', label: 'Home' },
    { id: 'patient',     href: 'patient.html',     icon: '📋', label: 'Patient' },
    { id: 'emergency',   href: 'emergency.html',   icon: '🚨', label: 'Emergency', cls: 'emergency-tab' },
    { id: 'appointment', href: 'appointment.html', icon: '📅', label: 'Appt' },
    { id: 'profile',     href: 'profile.html',     icon: '👤', label: 'Profile' },
  ];
  return `
  <nav class="tab-bar">
    ${tabs.map(t => `
      <a href="${t.href}"
        class="tab-item ${t.cls || ''} ${activePage === t.id ? 'active' : ''}">
        <span class="icon">${t.icon}</span>
        <span>${t.label}</span>
      </a>
    `).join('')}
  </nav>`;
}
// ══════════════════════════════════════════════════
//   SECTION 2 — Toast Notification
// ══════════════════════════════════════════════════

function showToast(msg, duration = 2500) {
  let el = document.querySelector('.toast-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-msg';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

// ══════════════════════════════════════════════════
//   SECTION 3 — Bootstrap Alert Helper
// ══════════════════════════════════════════════════

function showAlert(message, type = 'success') {
  // Pehle se koi alert ho toh hatao
  const existing = document.getElementById('firestoreAlert');
  if (existing) existing.remove();

  const alertDiv = document.createElement('div');
  alertDiv.id = 'firestoreAlert';
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.style.cssText = `
    position: fixed;
    top: 16px;
    left: 16px;
    right: 16px;
    z-index: 9999;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  `;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close"
      data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  document.body.appendChild(alertDiv);

  // 4 second baad apne aap band ho jaayega
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
    }
  }, 4000);
}

// ══════════════════════════════════════════════════
//   SECTION 4 — Form Data Collect karne ke Helpers
// ══════════════════════════════════════════════════

function collectLabReports() {
  const rows = document.querySelectorAll('#labRows .lab-row');
  const results = [];
  rows.forEach(row => {
    const name  = row.querySelector('.lab-name')?.value.trim();
    const value = row.querySelector('.lab-value')?.value.trim();
    if (name) results.push({ name, value: value || '—' });
  });
  return results;
}

function collectPrescribedMedicines() {
  const rows = document.querySelectorAll('#medRows > div[id^="med_"]');
  const results = [];
  rows.forEach(row => {
    const name = row.querySelector('.med-name')?.value.trim();
    const dose = row.querySelector('.med-dose')?.value.trim();
    const freq = row.querySelector('.med-freq')?.value;
    const dur  = row.querySelector('.med-dur')?.value.trim();
    if (name) results.push({
      name,
      dose: dose || '—',
      freq: freq || '—',
      dur:  dur  || '—'
    });
  });
  return results;
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}
// ══════════════════════════════════════════════════
//   SECTION 5 — Poora Patient Form Data Collect karo
// ══════════════════════════════════════════════════

function collectPatientFormData() {
  const gender = getVal('gender');

  return {
    // ── Personal ────────────────────────────────
    fullName:   getVal('fullName'),
    age:        getVal('age'),
    gender,
    bloodGroup: getVal('bloodGroup'),
    contact:    getVal('contact'),
    address:    getVal('address'),

    // ── Chief Complaint ──────────────────────────
    chiefComplaint: getVal('chiefComplaint'),
    duration:       getVal('duration'),
    severity:       getVal('severity'),
    worsening:      getRadioValue('worsening'),

    // ── Medical History ──────────────────────────
    prevIllness:      getVal('prevIllness'),
    surgeries:        getVal('surgeries'),
    hospitalizations: getVal('hospitalizations'),

    // ── Family History ───────────────────────────
    familyHistory: {
      diabetes: getChecked('fhDiabetes'),
      bp:       getChecked('fhBP'),
      heart:    getChecked('fhHeart'),
      cancer:   getChecked('fhCancer'),
      kidney:   getChecked('fhKidney'),
      thyroid:  getChecked('fhThyroid'),
      other:    getVal('fhOther'),
    },

    // ── Medications ──────────────────────────────
    currentMeds: getVal('currentMeds'),
    allergies:   getVal('allergies'),

    // ── Vitals ───────────────────────────────────
    vitals: {
      bp:     getVal('vBP'),
      temp:   getVal('vTemp'),
      pulse:  getVal('vPulse'),
      spo2:   getVal('vSpO2'),
      weight: getVal('vWeight'),
      height: getVal('vHeight'),
    },

    // ── Dynamic Rows ─────────────────────────────
    labReports:          collectLabReports(),
    prescribedMedicines: collectPrescribedMedicines(),

    // ── Addiction ────────────────────────────────
    addiction: getRadioValue('addiction'),
    addictionDetails: {
      tobacco: getChecked('addTobacco'),
      alcohol: getChecked('addAlcohol'),
      smoking: getChecked('addSmoking'),
      drugs:   getChecked('addDrugs'),
      years:   getVal('addYears'),
      qty:     getVal('addQty'),
    },

    // ── Lifestyle ────────────────────────────────
    sleep:    getVal('sleep'),
    exercise: getVal('exercise'),
    diet:     getRadioValue('diet'),

    // ── Women's Health (sirf Female ke liye) ─────
    womenHealth: gender === 'Female' ? {
      pregnancy:       getVal('pregnancy'),
      lmp:             getVal('lmp'),
      cycleLen:        getVal('cycleLen'),
      menstrualIssues: getVal('menstrualIssues'),
      gravida:         getVal('gravida'),
    } : null,

    // ── Mental Health ────────────────────────────
    stressLevel:   getVal('stressLevel'),
    mentalHistory: getRadioValue('mentalHistory'),
    mentalNotes:   getVal('mentalNotes'),

    // ── Metadata ─────────────────────────────────
    savedAt:   new Date().toISOString(),
    createdAt: Timestamp.now(),
  };
}

// ══════════════════════════════════════════════════
//   SECTION 6 — Firestore mein Save karo
// ══════════════════════════════════════════════════

async function savePatientToFirestore(data) {
  const docRef = await addDoc(collection(db, 'patients'), data);
  return docRef.id;
}
// ══════════════════════════════════════════════════
//   SECTION 7 — Main Save Button Handler
// ══════════════════════════════════════════════════

async function savePatient() {

  // ── Validation ──────────────────────────────────
  const fullName = getVal('fullName');
  if (!fullName) {
    showAlert(
      '⚠️ <strong>Full Name zaroori hai.</strong> Patient ka naam enter karo.',
      'warning'
    );
    document.getElementById('fullName').focus();
    return;
  }

  // ── Save button ko loading state mein daalo ──────
  const saveBtn = document.querySelector('button[onclick="savePatient()"]');
  const originalText = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Saving...';
  }

  try {
    // ── Form ka poora data collect karo ─────────
    const patientData = collectPatientFormData();

    // ── Firestore mein save karo ─────────────────
    const docId = await savePatientToFirestore(patientData);

    // ── localStorage mein backup save karo ──────
    setPatient({ ...patientData, firestoreId: docId });

    // ── Success message dikhao ───────────────────
    showAlert(
      `✅ <strong>Patient record successfully save ho gaya!</strong><br>
       <small>
         Patient: <strong>${fullName}</strong>
         &nbsp;|&nbsp;
         Firebase ID: <code>${docId}</code>
       </small>`,
      'success'
    );
    showToast('✅ Firebase mein save ho gaya!');

    console.log('✅ Patient saved. Project: hospital-170a2 | Doc ID:', docId);

    // ── Page ke upar scroll karo ─────────────────
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {

    // ── Error message dikhao ─────────────────────
    console.error('❌ Firestore save error:', error);
    showAlert(
      `❌ <strong>Save nahi hua.</strong> Firebase se connection nahi bana.<br>
       <small>Error: ${error.message}</small>`,
      'danger'
    );
    showToast('❌ Save fail. Connection check karo.');

  } finally {

    // ── Button wapas normal karo ─────────────────
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }
}

// ══════════════════════════════════════════════════
//   SECTION 8 — DOM Ready par Init
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
});

// ══════════════════════════════════════════════════
//   EXPORTS — dusri files use kar sakti hain
// ══════════════════════════════════════════════════

export {
  getUser, setUser, clearUser,
  getPatient, setPatient,
  getAppointments, saveAppointments,
  addAppointment, cancelAppointment,
  isDarkMode, setDarkMode,
  logout, formatDate, getInitials,
  buildTabBar, showToast, showAlert,
  requireAuth, savePatient,
};




