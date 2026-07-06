/* ===========================================================
   Pulse — Smart Healthcare Assistant
   Base project logic. No backend required — data persists
   in the browser via localStorage.
   =========================================================== */

/* ----------------------- Navigation ----------------------- */
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('is-active'));
    views.forEach(v => v.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('is-active');
  });
});

/* ----------------------- Storage helpers ----------------------- */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* ===========================================================
   SYMPTOM CHECKER
   Simple rule-based triage. Replace/extend `rules` with a
   real model call (see CHAT section below) for smarter output.
   =========================================================== */
const symptomForm = document.getElementById('symptom-form');
const checkBtn = document.getElementById('check-symptoms-btn');
const resultCard = document.getElementById('symptom-result');

const RED_FLAGS = ['chestPain', 'shortnessOfBreath'];

checkBtn.addEventListener('click', () => {
  const selected = [...symptomForm.querySelectorAll('input:checked')].map(i => i.value);

  if (selected.length === 0) {
    resultCard.hidden = false;
    resultCard.innerHTML = `<p>Select at least one symptom to get an assessment.</p>`;
    return;
  }

  let urgency = 'low';
  let advice = 'These symptoms are usually manageable at home. Rest, stay hydrated, and monitor for changes over the next 24–48 hours.';

  const hasRedFlag = selected.some(s => RED_FLAGS.includes(s));
  const highCount = selected.length;

  if (hasRedFlag) {
    urgency = 'high';
    advice = 'Chest pain or shortness of breath can signal something serious. Seek in-person medical care now, or contact emergency services if it worsens.';
  } else if (highCount >= 4 || selected.includes('fever') && selected.includes('fatigue')) {
    urgency = 'medium';
    advice = 'This combination of symptoms is worth a conversation with a doctor in the next day or two, especially if it hasn\'t improved.';
  }

  const labelMap = { low: 'Low urgency', medium: 'Talk to a doctor soon', high: 'Seek care now' };

  resultCard.hidden = false;
  resultCard.innerHTML = `
    <span class="urgency-badge urgency-${urgency}">${labelMap[urgency]}</span>
    <h3>Based on ${selected.length} symptom${selected.length > 1 ? 's' : ''}</h3>
    <p>${advice}</p>
    <p style="margin-top:10px; font-size:0.8rem;">This is a general guide, not a diagnosis. When in doubt, contact a licensed clinician.</p>
  `;
});

/* ===========================================================
   APPOINTMENTS
   =========================================================== */
const apptForm = document.getElementById('appt-form');
const apptList = document.getElementById('appt-list');
let appointments = store.get('pulse.appointments', []);

function renderAppointments() {
  apptList.innerHTML = '';
  appointments
    .slice()
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .forEach(appt => {
      const li = document.createElement('li');
      li.className = 'entry-item';
      li.innerHTML = `
        <div class="entry-main">
          <strong>${appt.doctor}</strong>
          <span>${appt.reason}</span>
        </div>
        <div class="entry-meta">${formatDate(appt.date)} · ${formatTime(appt.time)}</div>
        <button class="icon-btn" data-id="${appt.id}">Remove</button>
      `;
      li.querySelector('.icon-btn').addEventListener('click', () => {
        appointments = appointments.filter(a => a.id !== appt.id);
        store.set('pulse.appointments', appointments);
        renderAppointments();
        renderDashboard();
      });
      apptList.appendChild(li);
    });
  if (appointments.length === 0) {
    apptList.innerHTML = `<li class="empty-state">No appointments yet. Add one above.</li>`;
  }
}

apptForm.addEventListener('submit', e => {
  e.preventDefault();
  appointments.push({
    id: crypto.randomUUID(),
    doctor: document.getElementById('appt-doctor').value,
    reason: document.getElementById('appt-reason').value,
    date: document.getElementById('appt-date').value,
    time: document.getElementById('appt-time').value
  });
  store.set('pulse.appointments', appointments);
  apptForm.reset();
  renderAppointments();
  renderDashboard();
});

/* ===========================================================
   MEDICATIONS
   =========================================================== */
const medForm = document.getElementById('med-form');
const medList = document.getElementById('med-list');
let medications = store.get('pulse.medications', []);

function renderMedications() {
  medList.innerHTML = '';
  medications.forEach(med => {
    const li = document.createElement('li');
    li.className = 'entry-item';
    li.innerHTML = `
      <div class="entry-main">
        <strong>${med.name} — ${med.dosage}</strong>
        <span>${med.frequency}</span>
      </div>
      <div class="entry-meta">${formatTime(med.time)}</div>
      <div class="med-check">
        <label><input type="checkbox" ${med.takenToday ? 'checked' : ''}> Taken today</label>
        <button class="icon-btn" data-id="${med.id}">Remove</button>
      </div>
    `;
    li.querySelector('input[type="checkbox"]').addEventListener('change', e => {
      med.takenToday = e.target.checked;
      store.set('pulse.medications', medications);
      renderDashboard();
    });
    li.querySelector('.icon-btn').addEventListener('click', () => {
      medications = medications.filter(m => m.id !== med.id);
      store.set('pulse.medications', medications);
      renderMedications();
      renderDashboard();
    });
    medList.appendChild(li);
  });
  if (medications.length === 0) {
    medList.innerHTML = `<li class="empty-state">No medications yet. Add one above.</li>`;
  }
}

medForm.addEventListener('submit', e => {
  e.preventDefault();
  medications.push({
    id: crypto.randomUUID(),
    name: document.getElementById('med-name').value,
    dosage: document.getElementById('med-dosage').value,
    time: document.getElementById('med-time').value,
    frequency: document.getElementById('med-frequency').value,
    takenToday: false
  });
  store.set('pulse.medications', medications);
  medForm.reset();
  renderMedications();
  renderDashboard();
});

/* ===========================================================
   DASHBOARD SUMMARY
   =========================================================== */
function renderDashboard() {
  const nextApptEl = document.getElementById('dash-next-appt');
  const upcoming = appointments
    .slice()
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))[0];

  nextApptEl.innerHTML = upcoming
    ? `<strong>${upcoming.doctor}</strong><br><span style="color:var(--ink-soft)">${formatDate(upcoming.date)} · ${formatTime(upcoming.time)} — ${upcoming.reason}</span>`
    : 'No appointments scheduled yet.';
  nextApptEl.className = upcoming ? '' : 'empty-state';

  const medsEl = document.getElementById('dash-meds');
  if (medications.length === 0) {
    medsEl.innerHTML = 'No medications added yet.';
    medsEl.className = 'empty-state';
  } else {
    medsEl.className = '';
    medsEl.innerHTML = medications.map(m =>
      `<div style="margin-bottom:8px;">${m.takenToday ? '✓' : '○'} <strong>${m.name}</strong> <span style="color:var(--ink-soft)">${m.dosage} · ${formatTime(m.time)}</span></div>`
    ).join('');
  }
}

/* ----------------------- Formatting helpers ----------------------- */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/* ===========================================================
   HEALTH CHAT (rule-based demo)
   To upgrade this to a real AI assistant, replace
   `getBotReply` with a call to the Anthropic API, e.g.:

   async function getBotReply(message) {
     const res = await fetch('https://api.anthropic.com/v1/messages', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         model: 'claude-sonnet-4-6',
         max_tokens: 300,
         messages: [{ role: 'user', content: message }]
       })
     });
     const data = await res.json();
     return data.content.map(b => b.text || '').join('\n');
   }
   =========================================================== */
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

const CHAT_RULES = [
  { keywords: ['sleep', 'tired', 'insomnia'], reply: 'Aim for 7–9 hours nightly. A consistent bedtime and limiting screens beforehand help most people fall asleep faster.' },
  { keywords: ['water', 'hydrat', 'thirsty'], reply: 'Most adults need roughly 2–3 liters of water a day, more if it\'s hot or you\'re active. Your urine color is a decent everyday guide — pale yellow is a good sign.' },
  { keywords: ['medic', 'pill', 'dose', 'reminder'], reply: 'You can add medications with a scheduled time in the Medications tab, and check them off as you take them each day.' },
  { keywords: ['appointment', 'doctor', 'book', 'schedule'], reply: 'Head to the Appointments tab to add a doctor, reason for visit, date, and time — it\'ll show up on your dashboard too.' },
  { keywords: ['stress', 'anxious', 'anxiety'], reply: 'Short breathing exercises (like 4 seconds in, 6 seconds out) can lower stress in the moment. If it\'s persistent, a conversation with a mental health professional is worth considering.' },
  { keywords: ['fever', 'cough', 'symptom', 'sick', 'pain'], reply: 'For a proper read on symptoms, try the Symptom Checker tab — it\'ll flag whether you should rest, see a doctor soon, or seek care now.' },
];

function getBotReply(message) {
  const lower = message.toLowerCase();
  const match = CHAT_RULES.find(rule => rule.keywords.some(k => lower.includes(k)));
  return match
    ? match.reply
    : 'I can help with sleep, hydration, medications, appointments, stress, or general symptoms — try asking about one of those.';
}

function addBubble(text, sender) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${sender}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addBubble(message, 'user');
  chatInput.value = '';
  setTimeout(() => addBubble(getBotReply(message), 'bot'), 300);
});

/* ----------------------- Init ----------------------- */
renderAppointments();
renderMedications();
renderDashboard();
