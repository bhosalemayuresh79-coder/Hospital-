// ================================================
//   AYA HOSPITAL — app.js
//   Shared JS: localStorage helpers + Firebase
//   Firestore patient data entry logic
// ================================================

import { db } from "./firebase-config.js";
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
      <a href="${t.href}" class="tab-item ${t.cls || ''} ${activePage === t.id ? 'active' : ''}">
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
  // Remove any existing alert first
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
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  document.body.appendChild(alertDiv);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
    }
  }, 4000);
}

// ══════════════════════════════════════════════════
//   SECTION 4 — Collect Form Data from patient.html
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
    if (name) results.push({ name, dose: dose || '—', freq: freq || '—', dur: dur || '—' });
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

function collectPatientFormData() {
  const gender = getVal('gender');

  return {
    // ── Personal ──────────────────────────────────
    fullName:   getVal('fullName'),
    age:        getVal('age'),
    gender,
    bloodGroup: getVal('bloodGroup'),
    contact:    getVal('contact'),
    address:    getVal('address'),

    // ── Chief Complaint ───────────────────────────
    chiefComplaint: getVal('chiefComplaint'),
    duration:       getVal('duration'),
    severity:       getVal('severity'),
    worsening:      getRadioValue('worsening'),

    // ── Medical History ───────────────────────────
    prevIllness:      getVal('prevIllness'),
    surgeries:        getVal('surgeries'),
    hospitalizations: getVal('hospitalizations'),

    // ── Family History ────────────────────────────
    familyHistory: {
      diabetes: getChecked('fhDiabetes'),
      bp:       getChecked('fhBP'),
      heart:    getChecked('fhHeart'),
      cancer:   getChecked('fhCancer'),
      kidney:   getChecked('fhKidney'),
      thyroid:  getChecked('fhThyroid'),
      other:    getVal('fhOther'),
    },

    // ── Medications ───────────────────────────────
    currentMeds: getVal('currentMeds'),
    allergies:   getVal('allergies'),

    // ── Vitals ────────────────────────────────────
    vitals: {
      bp:     getVal('vBP'),
      temp:   getVal('vTemp'),
      pulse:  getVal('vPulse'),
      spo2:   getVal('vSpO2'),
      weight: getVal('vWeight'),
      height: getVal('vHeight'),
    },

    // ── Dynamic Rows ──────────────────────────────
    labReports:          collectLabReports(),
    prescribedMedicines: collectPrescribedMedicines(),

    // ── Addiction ─────────────────────────────────
    addiction: getRadioValue('addiction'),
    addictionDetails: {
      tobacco: getChecked('addTobacco'),
      alcohol: getChecked('addAlcohol'),
      smoking: getChecked('addSmoking'),
      drugs:   getChecked('addDrugs'),
      years:   getVal('addYears'),
      qty:     getVal('addQty'),
    },

    // ── Lifestyle ─────────────────────────────────
    sleep:    getVal('sleep'),
    exercise: getVal('exercise'),
    diet:     getRadioValue('diet'),

    // ── Women's Health (only if Female) ───────────
    womenHealth: gender === 'Female' ? {
      pregnancy:       getVal('pregnancy'),
      lmp:             getVal('lmp'),
      cycleLen:        getVal('cycleLen'),
      menstrualIssues: getVal('menstrualIssues'),
      gravida:         getVal('gravida'),
    } : null,

    // ── Mental Health ─────────────────────────────
    stressLevel:   getVal('stressLevel'),
    mentalHistory: getRadioValue('mentalHistory'),
    mentalNotes:   getVal('mentalNotes'),

    // ── Metadata ──────────────────────────────────
    savedAt:   new Date().toISOString(),
    createdAt: Timestamp.now(),
  };
}

// ══════════════════════════════════════════════════
//   SECTION 5 — Save to Firestore
// ══════════════════════════════════════════════════

async function savePatientToFirestore(data) {
  const docRef = await addDoc(collection(db, 'patients'), data);
  return docRef.id;
}

// ══════════════════════════════════════════════════
//   SECTION 6 — Form Submit Handler
// ══════════════════════════════════════════════════

async function savePatient() {
  // ── Validation ────────────────────────────────
  const fullName = getVal('fullName');
  if (!fullName) {
    showAlert('⚠️ <strong>Full Name is required.</strong> Please enter the patient name.', 'warning');
    document.getElementById('fullName').focus();
    return;
  }

  // ── Show loading state on button ──────────────
  const saveBtn = document.querySelector('button[onclick="savePatient()"]');
  const originalText = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Saving...';
  }

  try {
    // ── Collect all form data ──────────────────
    const patientData = collectPatientFormData();

    // ── Save to Firestore ──────────────────────
    const docId = await savePatientToFirestore(patientData);

    // ── Save to localStorage as backup ────────
    setPatient({ ...patientData, firestoreId: docId });

    // ── Success feedback ───────────────────────
    showAlert(
      `✅ <strong>Patient record saved successfully!</strong><br>
       <small>Patient: <strong>${fullName}</strong> &nbsp;|&nbsp; Firestore ID: <code>${docId}</code></small>`,
      'success'
    );
    showToast('✅ Saved to Firebase!');

    console.log('✅ Patient saved to Firestore. Doc ID:', docId);

    // ── Scroll to top ──────────────────────────
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    // ── Error feedback ─────────────────────────
    console.error('❌ Firestore save error:', error);
    showAlert(
      `❌ <strong>Save failed.</strong> Could not connect to Firebase.<br>
       <small>Error: ${error.message}</small>`,
      'danger'
    );
    showToast('❌ Save failed. Check connection.');

  } finally {
    // ── Restore button ─────────────────────────
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }
}

// ══════════════════════════════════════════════════
//   SECTION 7 — Init on DOM Ready
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
});
