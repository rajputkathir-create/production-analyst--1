# Production Analyst

Healthcare Production Analytics Platform — Full-Stack Web Application

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI |
| Database | MongoDB 7 + Motor (async) |
| Auth | JWT (python-jose) + bcrypt |
| Charts | Recharts |
| Docker | Docker + Docker Compose |

---

## Default Login

```
Username: SUPERADMIN
Password: SUPERADMIN
```

> ⚠️ Change this password immediately after first login.

---

## Quick Start

### With Docker (Recommended)

```bash
git clone <repo>
cd production-analyst
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Manual Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**MongoDB:**
```bash
# Make sure MongoDB is running on localhost:27017
mongod --dbpath /data/db
```

---

## Project Structure

```
production-analyst/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # MongoDB connection
│   ├── requirements.txt
│   ├── .env                 # Environment variables
│   ├── middleware/
│   │   └── auth.py          # JWT auth middleware
│   ├── routers/
│   │   ├── auth.py          # Login, change-password
│   │   ├── users.py         # User CRUD
│   │   ├── teams.py         # Team management
│   │   ├── production.py    # Production entries
│   │   ├── targets.py       # Target management
│   │   ├── dashboard.py     # Analytics aggregation
│   │   ├── settings.py      # App settings
│   │   └── excel.py         # Excel import
│   └── utils/
│       ├── seed.py          # Default SUPERADMIN seed
│       └── helpers.py       # Serialization, calculations
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Routes & auth guards
│   │   ├── main.jsx         # Entry point
│   │   ├── index.css        # Tailwind + design system
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js       # Axios API client
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Layout.jsx   # Sidebar layout
│   │   │       └── Modal.jsx    # Reusable modal
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── ChangePasswordPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── ProductionPage.jsx
│   │       ├── UsersPage.jsx
│   │       ├── TeamsPage.jsx
│   │       ├── TargetsPage.jsx
│   │       ├── ExcelImportPage.jsx
│   │       └── SettingsPage.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docker-compose.yml
└── README.md
```

---

## User Roles & Access

| Feature | Super Admin | Admin | Team Leader | Member |
|---------|------------|-------|-------------|--------|
| Dashboard | ✅ | ✅ | ❌ | ❌ |
| Production (view) | ✅ | ✅ | ✅ | ✅ (own team) |
| Production (add/edit) | ✅ | ✅ | ✅ | ❌ |
| Production (delete) | ✅ | ✅ | ❌ | ❌ |
| Targets | ✅ | ✅ | ❌ | ❌ |
| Users | ✅ | ✅ | ❌ | ❌ |
| Teams | ✅ | ✅ | ❌ | ❌ |
| Excel Import | ✅ | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |

---

## MongoDB Collections

| Collection | Description |
|-----------|-------------|
| `users` | User accounts with roles |
| `teams` | Production teams |
| `production_entries` | Daily production records |
| `targets` | Team/user production targets |
| `settings` | Global app configuration |

---

## Production Formula

```
Production % = (Production Value / Target Value) × 100
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |
| GET | `/api/production` | List entries |
| POST | `/api/production` | Create entry |
| PUT | `/api/production/{id}` | Update entry |
| GET | `/api/dashboard/summary` | Analytics summary |
| GET | `/api/targets` | List targets |
| POST | `/api/targets` | Create target |
| POST | `/api/excel/import` | Import Excel/CSV |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

Full interactive docs at: `http://localhost:8000/docs`

---

## Excel Import Format

Required columns (case-insensitive, spaces → underscores):
- `team_name`
- `user_name`
- `production_value`
- `date` (YYYY-MM-DD)

Optional:
- `client_name`
- `target_value`

Download the CSV template from the Excel Import page in the app.

---

## Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=production_analyst
SECRET_KEY=your-secure-secret-key
ACCESS_TOKEN_EXPIRE_HOURS=24
```
