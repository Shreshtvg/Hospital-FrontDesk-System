# 🏥 Hospital FrontDesk System

A web-based Hospital FrontDesk System that allows patients to book appointments and doctors to manage patient queues in real-time. This full-stack application includes a Nextjs frontend and a FastAPI backend.

---

## 🚀 Features

### ✅ For Patients
- Book appointments with available doctors
- Select date and time slot
- Instant confirmation

### 👨‍⚕️ For Doctors
- Login securely with JWT authentication
- View live patient queue
- Mark patients as "Done" after consultation

---

## 🛠️ Tech Stack

| Frontend | Backend | Auth | Deployment |
|----------|---------|------|------------|
| React.js (Next.js) | FastAPI (Python) | JWT Tokens | Render.com |

---

## 🧑‍💻 Local Setup

### Prerequisites
- Node.js & npm
- Python 3.8+
- Git

---

### 🔧 Frontend Setup and Start

```bash
cd frontend
npm install
npm run dev
```

### 🔧 Backend Setup and Start

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
