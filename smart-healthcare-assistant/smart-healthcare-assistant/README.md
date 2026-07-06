# Pulse — Smart Healthcare Assistant (base project)

A simple, no-build, no-backend starter for a healthcare assistant web app.
Open `index.html` in a browser — nothing to install.

## Structure
- `index.html` — page markup and the five views (Dashboard, Symptom Checker, Appointments, Medications, Health Chat)
- `style.css` — design tokens (colors, type, layout) and component styles
- `script.js` — all app logic: view routing, symptom-checker rules, appointments & medications CRUD (saved in `localStorage`), and a rule-based chat

## Features included
- **Dashboard** — mock vitals (heart rate, steps, sleep, water) plus a live summary of your next appointment and today's medications
- **Symptom Checker** — checkbox-based triage that returns a low/medium/high urgency read, with a red-flag rule for chest pain / shortness of breath
- **Appointments** — add/remove doctor visits with date & time, sorted automatically, persisted locally
- **Medications** — add/remove medications with dosage, time, and frequency; check off as taken each day
- **Health Chat** — a small keyword-matching assistant for sleep, hydration, meds, appointments, stress, and symptoms

## Extending it
- **Real AI chat**: `script.js` has a commented example showing how to replace `getBotReply` with an actual call to the Anthropic API (`/v1/messages`) so the chat gives real, model-generated answers instead of canned ones.
- **Real vitals**: swap the mock numbers in the dashboard for data from a wearable API or manual entry form.
- **Accounts / sync**: everything currently lives in the browser's `localStorage`. Swap in a backend (e.g. a small Node/Express API + database) to persist across devices.
- **Real triage logic**: the symptom checker's `rules` are intentionally simple placeholders — a production version should be built with clinical input, not just JS conditionals.

## Disclaimer
This app is a demo/starter kit. It does not provide medical diagnoses and is not a substitute for professional care.
