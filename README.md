# Online Examination & Quiz Management System

A production-quality MVP for an online examination and quiz management platform built on the MERN stack.

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + Axios + React Router + Lucide Icons
- **Backend**: Node.js + Express.js 5 + Morgan + CORS
- **Database**: MongoDB + Mongoose 9
- **Authentication**: JWT + bcryptjs (Phase 2)
- **Architecture**: REST API with role-based access control (Student, Teacher, Admin)

---

## Directory Structure

```
d:/ExamPortal/
├── package.json          # Root scripts to orchestrate client and server
├── README.md             # Project documentation and phase tracking
├── server/               # Express backend application
│   ├── .env              # Backend environment variables
│   ├── .env.example      # Example environment configuration
│   ├── package.json      # Backend dependencies & scripts
│   └── src/
│       ├── config/       # Database and service configurations (db.js)
│       ├── controllers/  # Request handlers (healthController.js, ...)
│       ├── middleware/   # Custom middlewares (errorHandler.js, ...)
│       ├── models/       # Mongoose schemas & models (Phase 2+)
│       ├── routes/       # API endpoints (healthRoutes.js, ...)
│       ├── services/     # Business logic & evaluators
│       ├── utils/        # Helper utilities
│       ├── app.js        # Express app configuration & middlewares
│       └── server.js     # Server entrypoint and DB connection
└── client/               # React + Vite frontend application
    ├── .env              # Client environment variables
    ├── .env.example      # Example client environment configuration
    ├── package.json      # Frontend dependencies & scripts
    ├── vite.config.js    # Vite configuration with Tailwind CSS & API proxy
    ├── index.html        # HTML template
    └── src/
        ├── components/   # Reusable UI components
        ├── context/      # State management & Auth contexts
        ├── hooks/        # Custom React hooks
        ├── layouts/      # App layout wrappers
        ├── pages/        # Route page components
        ├── routes/       # Router configurations
        ├── services/     # API client (Axios with JWT interceptors)
        ├── utils/        # UI and formatting helpers
        ├── App.jsx       # Main application view with health check dashboard
        ├── index.css     # Global styles and Tailwind CSS imports
        └── main.jsx      # React entrypoint
```

---

## Environment Variables

### Server (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/exam_portal
JWT_SECRET=hackathon_super_secret_exam_portal_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client (`client/.env`):
```env
VITE_API_URL=/api
```

---

## How to Run

### 1. Start Backend Server:
```powershell
cd server
npm run dev
# Running on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Start Frontend Client:
```powershell
cd client
npm run dev
# Running on http://localhost:5173
```

### Or run from the root:
```powershell
npm run server  # starts backend
npm run client  # starts frontend
```

---

## Phase 1 Status: COMPLETED
- [x] Initialized MERN project structure (`client/` and `server/`)
- [x] Installed and configured all required backend dependencies (Express, Mongoose, Dotenv, CORS, Morgan)
- [x] Configured MongoDB connection with error handling and status inspection
- [x] Verified running local MongoDB service on port 27017
- [x] Implemented Express API health check endpoint at `/api/health`
- [x] Scaffolding React + Vite with Tailwind CSS v4, Axios, React Router, and Lucide icons
- [x] Set up Axios service with automatic token injection and error handling
- [x] Built Phase 1 UI displaying real-time server and database health
- [x] Verified production build of frontend with zero errors
