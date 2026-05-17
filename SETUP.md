Setup: copy server/env.example to server/.env. Copy client/.env.example to client/.env.local. Enable Firebase Auth email password and Firestore. Download service account JSON and set GOOGLE*APPLICATION_CREDENTIALS in server .env (or FIREBASE_SERVICE_ACCOUNT_JSON for hosted APIs). Fill VITE_FIREBASE*\* in client .env.local. Leave VITE_API_BASE empty locally so Vite proxies /api to specific port.

Commands: from mini-hcm run npm install, npm run install:all, npm run dev. Install firebase-tools, run firebase login, firebase use your-project-id, then firebase deploy --only firestore:rules,firestore:indexes.
Admin: set users/{uid}.role to admin in console, or set ADMIN_SETUP_SECRET in server .env and paste matching value in profile setup form.

Production: build client with npm run build -w client, deploy hosting via firebase deploy --only hosting. Host server on Render etc., set CORS_ORIGIN, rebuild client with VITE_API_BASE set to public API URL.

Metrics: regular hours capped at shift length; OT beyond shift; ND 22:00-06:00 user timezone; late from first punch-in vs shift start; undertime from last punch-out vs shift end. Pairs bucketed by punch-in local date.
