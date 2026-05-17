# Mini HCM App

A full-stack Human Capital Management (HCM) web application built with React.js, Node.js, Express.js, and Firebase — designed to manage employee attendance, schedules, and daily KPIs.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mini--hcm--app.web.app-blue?style=flat-square)](https://mini-hcm-app.web.app/login)
[![GitHub](https://img.shields.io/badge/GitHub-kryss143%2Fmini--hcm--app-black?style=flat-square&logo=github)](https://github.com/kryss143/mini-hcm-app)

---

## Tech Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | React.js (Vite), TailwindCSS               |
| Backend  | Node.js, Express.js                        |
| Database | Firebase Firestore                         |
| Auth     | Firebase Authentication                    |
| API      | REST API                                   |
| Hosting  | Firebase Hosting (client), Vercel (server) |
| CI/CD    | GitHub Actions                             |

---

## Features

- **Authentication** — Email/password login and registration via Firebase Auth with Zod form validation and error handling
- **Employee Dashboard** — Punch in/out attendance tracking with real-time last punch display
- **Daily KPIs** — Tracks regular hours, overtime, night differential, late minutes, undertime, and total worked hours
- **Schedule Management** — Employee shift schedule display with timezone support
- **Date Filtering** — View daily summaries by selected date; auto-sets to today's date on load
- **Profile Setup** — First-time user onboarding flow with role assignment
- **Admin Controls** — Role-based access; admin setup via Firestore console or secret key
- **Session Restore** — Animated loading screen on session restore when returning to the app
- **Auto Redirect** — Redirects to login on expired or invalid Firebase auth tokens

---

## Project Structure

```
mini-hcm-app/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components (LoadingScreen, etc.)
│   │   ├── pages/           # Login, Register, Dashboard, Setup
│   │   ├── AuthContext.jsx  # Global auth state provider
│   │   ├── api.js           # Centralized API helper with auth error handling
│   │   └── firebase.js      # Firebase config and initialization
│   └── .env.local           # Client environment variables (see setup)
├── server/                  # Node.js + Express backend
│   └── .env                 # Server environment variables (see setup)
├── .github/workflows/       # GitHub Actions CI/CD
├── firebase.json            # Firebase Hosting config
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore indexes
└── SETUP.md                 # Detailed setup guide
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Firebase project with **Email/Password Auth** and **Firestore** enabled
- Firebase service account JSON (for backend)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kryss143/mini-hcm-app.git
cd mini-hcm-app

# 2. Install all dependencies
npm install
npm run install:all

# 3. Start development servers
npm run dev
```

### Environment Variables

**`client/.env.local`**

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID= 
VITE_API_BASE=              # leave empty locally (Vite proxies /api to specific port)
VITE_API_PROD_BASE=         # set to your production API URL
```

**`server/.env`**

```env
PORT=                             # dev test linked to vite config
GOOGLE_APPLICATION_CREDENTIALS=   # path to service account JSON (local)
FIREBASE_SERVICE_ACCOUNT_JSON=    # stringified JSON (for hosted APIs)
CORS_ORIGIN=                       # allowed frontend origin for development testing
CORS_ORIGIN2=                      # allowed frontend origin
ADMIN_SETUP_SECRET=                # optional: secret for admin profile setup
```

> See `SETUP.md` for the full detailed setup guide.

---

## Deployment

### Frontend — Firebase Hosting

```bash
# Build the client
npm run build -w client

# Deploy to Firebase
firebase deploy --only hosting
```

### Backend — Vercel / Render

Set `CORS_ORIGIN` to your Firebase Hosting URL and rebuild the client with `VITE_API_BASE` pointing to your production API URL.

### CI/CD — GitHub Actions

Pushes to `main` automatically build and deploy the frontend to Firebase Hosting. Add the following secrets to your GitHub repo under **Settings → Secrets and variables → Actions**:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_API_BASE
VITE_API_PROD_BASE
FIREBASE_SERVICE_ACCOUNT_MINI_HCM_APP
```

---

## Firestore & Security Rules

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Admin Setup

Set a user's role to `admin` by either:

- Going to **Firebase Console → Firestore → `users/{uid}`** and setting `role: "admin"`
- Setting `ADMIN_SETUP_SECRET` in `server/.env` and entering the matching value in the profile setup form

---

## KPI Metrics

| Metric             | Calculation                               |
| ------------------ | ----------------------------------------- |
| Regular Hours      | Capped at shift length                    |
| Overtime           | Hours worked beyond shift end             |
| Night Differential | Hours between 22:00–06:00 (user timezone) |
| Late Minutes       | First punch-in vs. shift start            |
| Undertime Minutes  | Last punch-out vs. shift end              |
| Total Worked Hours | Sum of all punch-in/out pairs             |

Punch pairs are bucketed by punch-in local date.

---

## License

This project is for educational and portfolio purposes.
