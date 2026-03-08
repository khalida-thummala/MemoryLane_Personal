# MemoryLane Backend API 🧠

The backend for MemoryLane is a robust Node.js/Express API that handles secure authentication, multimedia management via Cloudinary, and high-performance social networking features powered by Supabase.

## 📖 Project Overview
This service acts as the central intelligence for the MemoryLane ecosystem. It manages the lifecycle of memories (photos, videos, audio), enforces complex privacy rules (Private, Friends Only, Public), and maintains a real-time social graph for collaborations and connections.

## 🛠️ Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS)
- **Media Hosting:** Cloudinary (Multimedia Optimization & Delivery)
- **Security:** Helmet, CORS, Express-Rate-Limit, JWT-based Auth
- **Utilities:** Archiver (ZIP Exports), Canvas (Collage Generation), Node-Cron, Nodemailer

---

## 📡 API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate and get JWT |
| GET | `/profile` | Get current user's profile |
| PUT | `/profile` | Update profile metadata |
| DELETE | `/account` | Permanently delete user account |

### 🎞️ Memories (`/api/memories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | Fetch user's memories (search/filter support) |
| POST | `/` | Multimedia upload (Photos/Video/Audio) |
| GET | `/community` | Fetch the global Community Stream |
| GET | `/reminisce` | Flashback engine for specific date ranges |
| POST | `/reminisce/save-search` | Save search parameters for quick recall |
| POST | `/:id/like` | Like/Unlike a memory |
| POST | `/:id/comment` | Add community feedback |

### 👥 Social & Collaboration (`/api/albums`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | List all user albums |
| POST | `/` | Create a new themed scrapbook |
| GET | `/requests/pending` | View incoming collaboration invites |
| POST | `/:id/request` | Invite a collaborator by ID |
| POST | `/:id/accept` | Join a collaborative album |

### 📦 Exports & AI (`/api/export` / `/api/ai`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/export/zip` | Generate and download media ZIP |
| POST | `/ai/reminisce/generate` | Generate interactive stories/slideshows |

---

## 🏗️ Database Schema
MemoryLane uses a normalized relational schema in Supabase.
- **Profiles:** User identity, following stats, and preferences.
- **Memories:** Core entity with multi-media support and visibility states.
- **Collaborators:** Join table managing album access and roles.
- **Activity Logs:** Tracks milestone changes and critical actions.

---

## 🚀 Installation & Deployment

### Local Setup
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` with the following variables:
   ```env
   PORT=5000
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. **Run Dev Mode:**
   ```bash
   npm run dev
   ```

### Deployment
- **Platform:** Optimized for Render (Backend) and Supabase (Infrastructure).
- **Link:** `https://memorylane-personal.onrender.com`

---

## 🧪 Testing Utilities
Automated diagnostic scripts are available in `backend/tests/`:
- `debug_community.js`: Verifies visibility rules for public/friends content.
- `auth.test.js`: Validates sign-up/sign-in flows.
