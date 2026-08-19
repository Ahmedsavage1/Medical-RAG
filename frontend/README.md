# MedRAG Frontend

A **React 18 + Vite + Tailwind CSS v3** frontend for the Medical RAG system.

## Quick Start

> **Prerequisite:** Node.js ≥ 18 must be installed.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment

Edit `frontend/.env` to point at a different backend:

```
VITE_API_URL=http://127.0.0.1:8080
```

## File structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── context/
│   │   └── AuthContext.jsx   # JWT auth state
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── MessageList.jsx
│   │   └── ChatInput.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx     # POST /login
│   │   ├── RegisterPage.jsx  # POST /register
│   │   └── ChatPage.jsx      # POST /api/ask
│   ├── api.js                # fetch wrapper
│   ├── App.jsx               # routing
│   ├── main.jsx              # entry
│   └── index.css             # Tailwind + custom styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Features

| Feature | Detail |
|---|---|
| Auth | JWT stored in `localStorage`, auto-attached to API calls |
| Protected routes | `/chat` redirects to `/login` if no token |
| Auto-logout | 401 response clears token and redirects |
| Chat UX | Auto-growing textarea, Enter to send, typing indicator |
| Responsive | Works on mobile and desktop |
| Animations | Slide-up, fade-in, typing dots |
