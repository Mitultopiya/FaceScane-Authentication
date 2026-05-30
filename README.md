# FaceScane Auth

Production-ready authentication system with password login, face scan authentication, JWT sessions, and admin dashboard.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router, face-api.js, React Webcam |
| Backend | Node.js, Express, PostgreSQL, JWT, bcrypt, Nodemailer |
| Security | Helmet, Rate Limiting, CORS, Input Validation, Secure Cookies |

## Features

- **User Registration** — Name, email, password with validation and bcrypt hashing
- **Manual Login** — Email/password, JWT tokens, remember me, protected routes
- **Face Scan Auth** — Webcam face detection, descriptor storage, liveness detection, anti-spoof
- **Forgot Password** — Reset token via SMTP email with expiry
- **Security** — Helmet, rate limiter, CORS, parameterized SQL queries
- **Admin Dashboard** — User management, login logs, stats
- **Session Management** — Multi-device tracking, session revoke
- **Dark Mode** — Toggle with system preference detection

## Project Structure

```
FaceScane-Auth/
├── backend/
│   ├── database/schema.sql       # PostgreSQL schema
│   ├── src/
│   │   ├── config/               # Database, mail, env config
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/           # Auth, validation, rate limit, errors
│   │   ├── models/               # Database queries
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── utils/                # JWT, crypto, response helpers
│   │   ├── scripts/              # DB setup script
│   │   ├── app.js                # Express app
│   │   └── server.js             # Entry point
│   └── .env.example
├── frontend/
│   ├── public/models/            # face-api.js model files
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth & theme providers
│   │   ├── pages/                # Route pages
│   │   ├── services/             # API client
│   │   └── utils/                # Validation, face-api helpers
│   └── scripts/download-models.sh
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- SMTP credentials (Gmail App Password recommended for dev)

## Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb facescane_auth

# Or via psql
psql -U postgres -c "CREATE DATABASE facescane_auth;"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, and SMTP credentials

# Run database schema + create default admin
npm run db:setup

# Start development server
npm run dev
```

Default admin credentials (created by db:setup):
- Email: `admin@facescane.com`
- Password: `Admin@123456`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Download face-api.js models (required for face scan)
bash scripts/download-models.sh

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Email/password login |
| POST | `/api/auth/face-login` | Public | Face scan login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Bearer | Logout & revoke session |
| GET | `/api/auth/profile` | Bearer | Get user profile & sessions |
| POST | `/api/auth/face-register` | Bearer | Register face descriptor |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset password with token |
| DELETE | `/api/auth/sessions/:id` | Bearer | Revoke a session |
| GET | `/api/auth/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/auth/admin/users` | Admin | List all users |
| GET | `/api/auth/admin/login-logs` | Admin | Login activity logs |

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/facescane_auth
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Face Authentication Flow

1. **Registration** — User logs in, goes to Dashboard, clicks "Register Face"
2. **Liveness Check** — Blink detection + head movement + anti-spoof variance analysis
3. **Descriptor Storage** — 128-dimensional face vector stored in PostgreSQL (JSONB)
4. **Face Login** — User enters email, scans face, server compares descriptors (Euclidean distance < 0.6)

## SMTP Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the app password as `SMTP_PASS` in backend `.env`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique JWT secrets
3. Enable HTTPS (required for secure cookies)
4. Set `SMTP_SECURE=true` for port 465
5. Configure PostgreSQL with SSL
6. Build frontend: `npm run build` and serve static files

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens stored as httpOnly cookies
- Reset tokens hashed (SHA-256) before database storage
- Rate limiting on auth endpoints (10 req/15min)
- Parameterized SQL queries prevent injection
- Email enumeration prevented on forgot password

## License

MIT
