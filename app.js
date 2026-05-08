/* =====================================================
   AYA HOSPITAL — Shared JS (app.js)
   ===================================================== */

// ── LocalStorage Keys ──────────────────────────────────
const KEYS = {
  user:         'ayaUser',
  patient:      'ayaPatient',
  appointments: 'ayaAppointments',
  darkMode:     'ayaDarkMode',
  language:     'ayaLanguage',
};

// ── Auth Guard ─────────────────────────────────────────
function requireAuth() {
  const user = getUser();
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}

// ── User ───────────────────────────────────────────────
function getUser()       { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
function setUser(data)   { localStorage.setItem(KEYS.user, JSON.stringify(data)); }
function clearUser()     { localStorage.removeItem(KEYS.user); }

// ── Patient ────────────────────────────────────────────
function getPatient()    { return JSON.parse(localStorage.getItem(KEYS.patient) || 'null'); }
function setPatient(d)   { localStorage.setItem(KEYS.patient, JSON.stringify(d)); }

// ── Appointments ───────────────────────────────────────
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

// ── Dark Mode ──────────────────────────────────────────
function isDarkMode() { return localStorage.getItem(KEYS.darkMode) === 'true'; }
function setDarkMode(val) {
  localStorage.setItem(KEYS.darkMode, val);
  document.body.classList.toggle('dark-mode', val);
}
function initDarkMode() { if (isDarkMode()) document.body.classList.add('dark-mode'); }

// ── Logout ─────────────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// ── Toast Notification ─────────────────────────────────
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

// ── Tab Bar Builder ────────────────────────────────────
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

// ── Format Date ────────────────────────────────────────
function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Get Initials ───────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

// ── Init on DOM ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
});
