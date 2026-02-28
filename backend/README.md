# MemoryLane Backend API 🧠

The backend for MemoryLane is a robust Node.js/Express API that handles secure authentication, multimedia management via Cloudinary, and high-performance social networking features powered by Supabase.

## 📖 Project Overview
This service acts as the central intelligence for the MemoryLane ecosystem. It manages the lifecycle of memories (photos, videos, audio), enforces complex privacy rules (Private, Friends Only, Public), and maintains a real-time social graph for collaborations and connections.

## 🛠️ Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Media Hosting:** Cloudinary (via Multer-Storage-Cloudinary)
- **Security:** Helmet, CORS, Express-Rate-Limit, JWT
- **Utilities:** Archiver (for data export), Node-Cron (scheduled tasks), Nodemailer

---

## 📡 API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/register` | Register a new user |
| POST | `/login` | Authenticate and get JWT |
| POST | `/logout` | Invalidate current session |
| GET | `/profile` | Get current user's profile |
| PUT | `/profile` | Update profile metadata |
| PUT | `/password` | Securely change password |

### 🎞️ Memories (`/api/memories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | Fetch user's memories (search/filter support) |
| POST | `/` | Cloudinary-backed multimedia upload |
| GET | `/community` | Fetch the global Community Stream |
| GET | `/:id` | Get details of a single memory |
| PUT | `/:id` | Update memory or edit visibility |
| DELETE | `/:id` | Permanently remove a memory |
| POST | `/:id/like` | Like/Unlike a memory |

### 👥 Social Circle (`/api/friends`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | List established connections |
| GET | `/pending` | List incoming friend invitations |
| GET | `/sent` | Track outgoing friend requests |
| POST | `/request/:id` | Send a new invitation |
| POST | `/accept/:id` | Establish a bidirectional connection |
| POST | `/cancel/:id` | Revoke a sent invitation |

### 📦 Data & Exports (`/api/export`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/zip` | Generate and download a ZIP of all user media |

---

## 🏗️ Database Schema
MemoryLane uses a normalized relational schema in Supabase.
- **Profiles:** User identity and metadata.
- **Memories:** Core entity with `visibility` states (`private`, `friends`, `public`).
- **Media:** 1:N relationship with memories for multi-file support.
- **Friend Requests:** Tracks the social graph state.
- **Albums/Collaboration:** Many-to-many relationships for shared collections.

> [!NOTE]  
> For the full ER diagram and column definitions, refer to [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) in the root directory.

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
- **Platform:** Optimized for Heroku, Railway, or Render.
- **Link:** [Backend API URL Placeholder]

---

## 🧪 Testing Utilities
Automated diagnostic scripts are available in `backend/tests/`:
- `debug_community.js`: Verifies Supabase visibility rules for public/friends content.
- `auth.test.js`: Validates sign-up/sign-in flows.
