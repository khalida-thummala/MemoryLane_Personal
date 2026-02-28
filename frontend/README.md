# MemoryLane 📸

MemoryLane is a premium, secure, and visually stunning digital time capsule designed to help users preserve, organize, and share their most cherished life moments. Built with a focus on high-end aesthetics and privacy, it allows users to capture memories in multiple formats—photos, videos, and voice notes—while managing complex social connections.

## 🌟 Key Features

### 🎞️ Multimedia Memories
- **Multi-Format Capture:** Attach photos, high-definition videos, and high-fidelity voice notes to any memory.
- **Interactive Timeline:** A beautifully animated, chronological feed of your life journey.
- **Smart Categorization:** Tag memories (e.g., "Family", "Travel") and mark "Major Milestones" for quick discovery.

### 🔒 Advanced Privacy & Security
- **Granular Visibility:** Choose who sees your content:
  - **Private:** Only you.
  - **Friends Only:** Validated connections in your social circle.
  - **Public:** Shared to the global community stream.
- **Secure Infrastructure:** Protected by Supabase Auth and professional-grade JWT middleware.
- **Encrypted Media:** Multimedia stored securely on Cloudinary.

### 👥 Social Circle
- **Connection Management:** Send, receive, and track friend invitations with the new "Initiations Sent" dashboard.
- **Request Control:** Revoke/Cancel sent requests before they are accepted.
- **Follower Stream:** A dedicated "Following" feed that prioritizes content from your trusted friends.

### 🛠️ Data Sovereignty
- **Data Export:** Securely export your entire history, including all uploaded media, as a structured ZIP archive.
- **Profile Customization:** Full control over your account settings, security preferences, and global identity.

---

## 🚀 Tech Stack

### Frontend
- **React (Vite):** Fast, modern UI framework.
- **Framer Motion:** High-end micro-animations and smooth transitions.
- **Tailwind CSS:** Professional-grade styling with a custom "Glassmorphism" theme.
- **Lucide React:** Consistent, premium iconography.
- **Axios:** Robust API communication.

### Backend & Database
- **Node.js & Express:** Scalable RESTful API architecture.
- **Supabase (PostgreSQL):** Relational database with UUID-based normalization.
- **Cloudinary:** Cloud-based multimedia storage and optimization.
- **Multer:** Efficient handling of multipart/form-data for media uploads.

---

## 🛠️ Installation Steps

### 1. Prerequisites
- Node.js (v18+)
- NPM or Yarn
- Supabase Account
- Cloudinary Account

### 2. Clone the Repository
```bash
git clone <repository-url>
cd MemoryLane_Personal
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```
Start the backend:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
Start the frontend:
```bash
npm run dev
```

---

## 🔗 Project Links

- **Deployment Link:** [Project URL Placeholder] (Add your hosted link here)
- **Backend API Documentation:** `http://localhost:5000/api`
- **Video Walkthrough:** [Demo Video Placeholder] (Add your Loom/YouTube link here)

## 🔑 Login Credentials (Testing)
- **Email:** `test@example.com`
- **Password:** `TestPassword123!`

---

## 🏗️ Database Architecture
For a deep dive into our normalized Supabase schema, see our [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) documentation.
